const { db, logError } = require("../util/helper");
const bcrypt = require("bcrypt");

exports.getList = async (req, res) => {
    try {
        const { business_id } = req;

        // 1. Fetch User List with Role and Branch names
        const sqlUsers = `
            SELECT u.id, u.name, u.email as username, u.tel, u.address, u.image as profile_image,
                   u.status, u.is_super_admin, r.name as role_name, b.name as branch_name,
                   u.role_id, u.branch_id, u.created_at as create_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.business_id = ?
            ORDER BY u.id ASC
        `;
        const [list] = await db.query(sqlUsers, [business_id]);

        // 2. Fetch Detailed Subscription Info
        const sqlSub = `
            SELECT 
                b.plan_id, p.name as plan_name, 
                p.max_branches, p.max_staff, p.max_products,
                s.end_date as deadline, s.status as sub_status
            FROM businesses b
            JOIN subscription_plans p ON b.plan_id = p.id
            LEFT JOIN subscriptions s ON b.id = s.business_id AND s.status = 'active'
            WHERE b.id = ?
            LIMIT 1
        `;
        const [subInfo] = await db.query(sqlSub, [business_id]);

        // 3. Calculate Statistics
        const totalStaff = list.length;
        const superAdmins = list.filter(u => u.is_super_admin === 1).length;
        const activeUsers = list.filter(u => u.status === 'active').length;
        const regularStaff = totalStaff - superAdmins;

        // 4. Fetch Meta Data for UI
        const [roles] = await db.query("SELECT id as value, name as label FROM roles WHERE business_id = ?", [business_id]);
        const [branches] = await db.query("SELECT id as value, name as label FROM branches WHERE business_id = ?", [business_id]);
        const totalBranches = branches.length;

        res.json({
            list,
            role: roles,
            branches: branches,
            summary: {
                total_staff: totalStaff,
                super_admins: superAdmins,
                active_users: activeUsers,
                regular_staff: regularStaff,
                total_branches: totalBranches
            },
            subscription: subInfo[0] || { plan_name: "Free Plan", deadline: "Lifetime", sub_status: "active" }
        });
    } catch (error) {
        logError("user.getList", error, res);
    }
};

exports.register = async (req, res) => {
    try {
        const { business_id } = req;
        const {
            id, name, username, password, role_id, branch_id, is_super_admin, address, tel, is_active
        } = req.body;

        const image = req.file?.path || req.file?.filename || null;
        const statusVal = (is_active === 1 || is_active === '1' || is_active === true) ? 'active' : 'inactive';

        if (id) {
            // Update existing staff
            let sql = "UPDATE users SET name=?, email=?, role_id=?, branch_id=?, is_super_admin=?, address=?, tel=?, status=?";
            let params = [name, username, role_id, branch_id, is_super_admin || 0, address, tel, statusVal];

            if (image) {
                sql += ", image=?";
                params.push(image);
            }

            if (password && password !== "") {
                sql += ", password=?";
                params.push(bcrypt.hashSync(password, 10));
            }

            sql += " WHERE id=? AND business_id=?";
            params.push(id, business_id);

            await db.query(sql, params);
            return res.json({ message: "User updated successfully" });
        } else {
            // Create new staff — check plan limits
            const { checkPlanLimit } = require("../util/helper");
            const limitCheck = await checkPlanLimit(business_id, 'staff');
            if (!limitCheck.allowed) {
                return res.status(403).json({
                    message: limitCheck.message,
                    limit_reached: true
                });
            }

            if (!password) {
                return res.status(400).json({ message: "Password is required for new users." });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            await db.query(`
                INSERT INTO users (business_id, branch_id, name, email, password, role_id, is_super_admin, address, tel, status, image) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [business_id, branch_id, name, username, hashedPassword, role_id, is_super_admin || 0, address, tel, statusVal, image]);

            return res.json({ message: "User created successfully! They can now login with their email and password." });
        }
    } catch (error) {
        logError("user.register", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;

        // Prevent self-deletion if needed, but for now just restrict by business_id
        const [data] = await db.query("DELETE FROM users WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ message: "User deleted successfully", data });
    } catch (error) {
        logError("user.remove", error, res);
    }
};
