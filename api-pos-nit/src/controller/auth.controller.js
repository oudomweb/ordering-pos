const { logError, db, removeFile } = require("../util/helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../util/config");

// Helper for JWT
const generateAccessToken = (data) => {
  return jwt.sign(data, config.token.access_token_key, { expiresIn: "7d" });
};

// 1. Register for Business Owner (SaaS Entry Point)
exports.register = async (req, res) => {
  try {
    const {
      business_name,
      owner_name,
      email,
      password,
      phone
    } = req.body;

    // Start Transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // A. Create Business
      const [business] = await conn.query(
        "INSERT INTO businesses (name, owner_name, email, phone, plan_type) VALUES (?, ?, ?, ?, ?)",
        [business_name, owner_name, email, phone, 'free']
      );
      const business_id = business.insertId;

      // B. Create Main Branch
      const [branch] = await conn.query(
        "INSERT INTO branches (business_id, name, is_main) VALUES (?, ?, ?)",
        [business_id, "Main Branch", '1']
      );
      const branch_id = branch.insertId;

      // D. Setup Owner Role and Permissions for the new business
      const [role_res] = await conn.query(
        "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)",
        [business_id, "Owner", "owner"]
      );
      const role_id = role_res.insertId;

      // Link all available permissions to this new Owner role
      await conn.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT ?, id FROM permissions
      `, [role_id]);

      // C. Create Owner Account
      const hashedPassword = bcrypt.hashSync(password, 10);
      await conn.query(
        "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [business_id, branch_id, role_id, owner_name, email, hashedPassword, 'active', 0]
      );

      await conn.commit();
      res.json({ success: true, message: "Business Registered Successfully!" });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    logError("auth.register", error, res);
  }
};

// 2. Login (SaaS Context Injection)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const sql = `
        SELECT u.*, 
               r.name as role_name, r.code as role_code,
               b.name as business_name, b.status as business_status, b.logo as business_logo,
               p.name as plan_name, p.max_branches, p.max_staff, p.max_products
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        INNER JOIN businesses b ON u.business_id = b.id
        INNER JOIN subscription_plans p ON b.plan_id = p.id
        WHERE u.email = ?
    `;

    const [users] = await db.query(sql, [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Account not found or incorrect email!" });
    }

    const user = users[0];

    // Check Business Status
    if (user.business_status !== 'active') {
      return res.status(403).json({ message: "Your business account is suspended!" });
    }

    // Check User Account Status
    if (user.status !== 'active') {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact your administrator." });
    }

    // Verify Password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Password incorrect!" });
    }

    // Create Token with SaaS Context
    const payload = {
      user_id: user.id,
      business_id: user.business_id,
      branch_id: user.branch_id,
      role_id: user.role_id,
      name: user.name,
      email: user.email,
      plan_name: user.plan_name,
      plan_limits: {
        branches: user.max_branches,
        staff: user.max_staff,
        products: user.max_products
      },
      business_name: user.business_name,
      role_name: user.role_name,
      role_code: user.role_code,
      business_logo: user.business_logo,
      profile_image: user.image
    };

    // Fetch Permissions for Backend/Frontend checks
    // We filter permissions based on the business's current plan level (min_plan_id)
    const [rolePerms] = await db.query(`
      SELECT p.route_key as web_route_key, p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ${user.business_id === 1 ? '' : 'AND p.min_plan_id <= (SELECT plan_id FROM businesses WHERE id = ?)'}
    `, user.business_id === 1 ? [user.role_id] : [user.role_id, user.business_id]);

    const permissions = rolePerms;
    payload.permissions = permissions.map(p => p.web_route_key.replace('/', '')); // Store as simple keys like 'my-plan', 'user']

    // Generate Token with permissions included
    const accessToken = generateAccessToken(payload);

    console.log(`Permissions granted to user ${user.email}:`, permissions.length);

    // Fetch Branch Name for Profile
    if (user.branch_id) {
      const [branch] = await db.query("SELECT name FROM branches WHERE id = ?", [user.branch_id]);
      if (branch.length > 0) payload.branch_name = branch[0].name;
    }

    res.json({
      message: "Login successful",
      access_token: accessToken,
      profile: {
        ...payload,
        is_super_admin: user.is_super_admin
      },
      permission: permissions
    });
  } catch (error) {
    logError("auth.login", error, res);
  }
};

// 3. User Profile (Synchronized with latest DB state)
exports.getProfile = async (req, res) => {
  try {
    const [fullUser] = await db.query(`
      SELECT u.*, r.name as role_name, r.code as role_code, b.name as business_name, br.name as branch_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN businesses b ON u.business_id = b.id
      LEFT JOIN branches br ON u.branch_id = br.id
      WHERE u.id = ?
    `, [req.user_id]);

    if (fullUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [rolePerms] = await db.query(`
       SELECT p.route_key as web_route_key, p.name FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?
    `, [fullUser[0].role_id]);

    res.json({
      profile: {
        ...fullUser[0],
        is_super_admin: fullUser[0].role_code === 'super_admin' ? 1 : 0
      },
      permission: rolePerms
    });
  } catch (error) {
    logError("auth.getProfile", error, res);
  }
};

// 4. Update Profile (User themselves)
exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user_id = req.user_id; // From token
    const image = req.file?.path || req.file?.filename;

    let sql = "UPDATE users SET name = ?";
    let params = [name];

    if (image) {
      sql += ", image = ?";
      params.push(image);
    }

    if (password && password.trim() !== "") {
      const hashedPassword = bcrypt.hashSync(password, 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    sql += " WHERE id = ?";
    params.push(user_id);

    // Update current profile in DB
    await db.query(sql, params);

    // Fetch refreshed user data with business and role context
    // We map 'u.image' to 'profile_image' for frontend consistency
    const [updatedUser] = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.image as profile_image, u.branch_id, u.business_id, u.role_id,
        b.name as business_name, b.logo as business_logo,
        r.name as role_name, r.code as role_code, br.name as branch_name
      FROM users u
      JOIN businesses b ON u.business_id = b.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches br ON u.branch_id = br.id
      WHERE u.id = ?
    `, [user_id]);

    const newProfile = {
      ...updatedUser[0],
      is_super_admin: updatedUser[0].role_code === 'super_admin' ? 1 : 0
    };

    res.json({
      success: true,
      message: "Profile updated successfully!",
      profile: newProfile
    });
  } catch (error) {
    logError("auth.updateProfile", error, res);
  }
};
