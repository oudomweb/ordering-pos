const { db, logError } = require("../util/helper");
const bcrypt = require("bcrypt");

exports.getList = async (req, res) => {
    try {
        // Only System Admins (Business ID 1) can view all businesses
        if (req.business_id !== 1) {
            return res.status(403).json({ message: "Forbidden: Platform management only" });
        }

        const sql = `
            SELECT b.*, p.name as plan_name,
                   (SELECT COUNT(*) FROM users WHERE business_id = b.id) as total_users,
                   (SELECT COUNT(*) FROM branches WHERE business_id = b.id) as total_branches,
                   (SELECT end_date FROM subscriptions WHERE business_id = b.id AND status = 'active' ORDER BY end_date DESC LIMIT 1) as expiry_date
            FROM businesses b
            JOIN subscription_plans p ON b.plan_id = p.id
            ORDER BY b.id DESC
        `;
        const [list] = await db.query(sql);
        res.json({ list });
    } catch (error) {
        logError("business.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        if (req.business_id !== 1) {
            return res.status(403).json({ message: "Forbidden: Only system admins can create businesses" });
        }

        const {
            business_name,
            owner_name,
            email,
            password,
            phone,
            plan_id
        } = req.body;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Create Business
            const [business] = await conn.query(
                "INSERT INTO businesses (name, owner_name, email, phone, plan_id, plan_type) VALUES (?, ?, ?, ?, ?, ?)",
                [business_name, owner_name, email, phone, plan_id || 1, 'pro']
            );
            const business_id = business.insertId;

            // 2. Create Main Branch
            const [branch] = await conn.query(
                "INSERT INTO branches (business_id, name, is_main) VALUES (?, ?, ?)",
                [business_id, "Main Branch", '1']
            );
            const branch_id = branch.insertId;

            // 3. Create Super Admin Role for this business
            const [role_res] = await conn.query(
                "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)",
                [business_id, "Owner", "owner"]
            );
            const role_id = role_res.insertId;

            // Link permissions allowed by the selected plan to the Owner role
            await conn.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                SELECT ?, id FROM permissions WHERE min_plan_id <= ?
            `, [role_id, plan_id || 1]);

            // 4. Create Owner Account
            const hashedPassword = bcrypt.hashSync(password, 10);
            await conn.query(
                "INSERT INTO users (business_id, branch_id, role_id, name, email, password, status, is_super_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [business_id, branch_id, role_id, owner_name, email, hashedPassword, 'active', 1]
            );

            // 5. Create Initial Subscription Record (30 days for new ones, or based on plan)
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // Default 30 days
            const formattedEndDate = endDate.toISOString().split('T')[0];

            await conn.query(
                "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                [business_id, plan_id || 1, plan_id == 1 ? 'free' : 'pro', startDate, formattedEndDate, 'active']
            );

            await conn.commit();
            res.json({ success: true, message: "Business and Owner created with 30-day active period!" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("business.create", error, res);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });

        const { id, status } = req.body;
        await db.query("UPDATE businesses SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: `Business ${status} successfully` });
    } catch (error) {
        logError("business.updateStatus", error, res);
    }
};

exports.updatePlan = async (req, res) => {
    try {
        if (req.business_id !== 1) return res.status(403).json({ message: "Forbidden" });

        const { business_id, plan_id, duration_days } = req.body;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Update business table
            await conn.query("UPDATE businesses SET plan_id = ? WHERE id = ?", [plan_id, business_id]);

            // 2. Set existing active subscriptions to expired
            await conn.query("UPDATE subscriptions SET status = 'expired' WHERE business_id = ? AND status = 'active'", [business_id]);

            // 3. Create new subscription period
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (duration_days || 30));
            const formattedEndDate = endDate.toISOString().split('T')[0];

            await conn.query(
                "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                [business_id, plan_id, plan_id == 1 ? 'free' : 'pro', startDate, formattedEndDate, 'active']
            );

            // 4. Auto-update Owner role permissions to match the new plan tier
            const [ownerRoles] = await conn.query("SELECT id FROM roles WHERE business_id = ? AND code = 'owner'", [business_id]);
            if (ownerRoles.length > 0) {
                const ownerRoleId = ownerRoles[0].id;
                await conn.query(`
                    INSERT IGNORE INTO role_permissions (role_id, permission_id)
                    SELECT ?, id FROM permissions WHERE min_plan_id <= ?
                `, [ownerRoleId, plan_id]);
            }

            await conn.commit();
            res.json({ message: "Business subscription plan updated successfully" });
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    } catch (error) {
        logError("business.updatePlan", error, res);
    }
};
