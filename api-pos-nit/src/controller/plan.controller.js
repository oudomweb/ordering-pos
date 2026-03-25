const { db, logError } = require("../util/helper");

exports.getAllPlans = async (req, res) => {
    try {
        const [plans] = await db.query("SELECT * FROM subscription_plans ORDER BY billing_cycle DESC, price ASC");
        res.json({
            plans,
            success: true
        });
    } catch (error) {
        logError("plan.getAllPlans", error, res);
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { id, name, max_branches, max_staff, max_products, price, billing_cycle, is_active } = req.body;
        await db.query(`
            UPDATE subscription_plans SET 
                name = ?, 
                max_branches = ?, 
                max_staff = ?, 
                max_products = ?, 
                price = ?, 
                billing_cycle = ?,
                is_active = ?
            WHERE id = ?
        `, [name, max_branches, max_staff, max_products, price, billing_cycle || 'monthly', is_active, id]);

        res.json({
            message: "Plan updated successfully",
            success: true
        });
    } catch (error) {
        logError("plan.updatePlan", error, res);
    }
};

exports.getBusinessPlan = async (req, res) => {
    try {
        const { business_id } = req;

        // 1. Get Plan & Business info
        const [plans] = await db.query(`
            SELECT p.*, b.name as business_name, b.plan_id
            FROM businesses b
            INNER JOIN subscription_plans p ON b.plan_id = p.id
            WHERE b.id = ?
        `, [business_id]);

        if (plans.length === 0) {
            return res.status(404).json({ message: "Plan not found" });
        }
        const plan = plans[0];

        // 2. Get Usage Statistics
        const [branches] = await db.query("SELECT COUNT(id) as total FROM branches WHERE business_id = ?", [business_id]);
        const [staff] = await db.query("SELECT COUNT(id) as total FROM users WHERE business_id = ?", [business_id]);
        const [products] = await db.query("SELECT COUNT(id) as total FROM products WHERE business_id = ?", [business_id]);

        // 3. Get Active Subscription Details
        const [subs] = await db.query(`
            SELECT id, start_date, end_date, status, price
            FROM subscriptions 
            WHERE business_id = ? AND status = 'active'
            ORDER BY end_date DESC LIMIT 1
        `, [business_id]);

        res.json({
            plan: {
                ...plan,
                usage: {
                    branches: branches[0].total,
                    staff: staff[0].total,
                    products: products[0].total
                },
                subscription: subs.length > 0 ? {
                    ...subs[0],
                    is_lifetime: subs[0].end_date === null
                } : {
                    start_date: plan.created_at,
                    end_date: null,
                    status: 'active',
                    is_lifetime: true
                }
            },
            success: true
        });
    } catch (error) {
        logError("plan.getBusinessPlan", error, res);
    }
};

exports.getSystemSubscriptions = async (req, res) => {
    try {
        // This is for Super Admin to see everyone's sub status
        const sql = `
            SELECT 
                b.id as business_id, b.name as business_name, b.owner_name,
                p.name as plan_name,
                s.end_date, s.status as sub_status,
                DATEDIFF(s.end_date, NOW()) as days_remaining
            FROM businesses b
            JOIN subscription_plans p ON b.plan_id = p.id
            LEFT JOIN subscriptions s ON b.id = s.business_id AND s.status = 'active'
            ORDER BY days_remaining ASC
        `;
        const [list] = await db.query(sql);
        res.json({ list, success: true });
    } catch (error) {
        logError("plan.getSystemSubscriptions", error, res);
    }
};
exports.selfUpgrade = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { business_id } = req;
        const { plan_id, duration_days } = req.body;

        if (!plan_id) return res.status(400).json({ success: false, message: "Plan ID is required" });

        // ======================================================
        // STEP 1: Validate — prevent downgrade to lower plan
        // ======================================================
        const [currentBiz] = await conn.query(
            "SELECT plan_id FROM businesses WHERE id = ?",
            [business_id]
        );
        if (!currentBiz.length) {
            conn.release();
            return res.status(404).json({ success: false, message: "Business not found" });
        }

        const currentPlanId = currentBiz[0].plan_id;

        if (parseInt(plan_id) === parseInt(currentPlanId)) {
            conn.release();
            return res.status(400).json({ success: false, message: "You are already on this plan." });
        }

        if (parseInt(plan_id) < parseInt(currentPlanId)) {
            conn.release();
            return res.status(400).json({
                success: false,
                message: "Cannot downgrade to a lower plan. Please contact support if you need to change your plan."
            });
        }
        // ======================================================

        await conn.beginTransaction();

        // 1. Update business table with new plan_id
        await conn.query("UPDATE businesses SET plan_id = ? WHERE id = ?", [plan_id, business_id]);

        // 2. Expire old active subscriptions
        await conn.query("UPDATE subscriptions SET status = 'expired' WHERE business_id = ? AND status = 'active'", [business_id]);

        // 3. Create new subscription period
        const [planRow] = await conn.query("SELECT billing_cycle FROM subscription_plans WHERE id = ?", [plan_id]);
        const isLifetime = planRow.length && planRow[0].billing_cycle === 'lifetime';

        const startDate = new Date();
        const startString = startDate.toISOString().split('T')[0];
        let endString = null;
        if (!isLifetime) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (duration_days || 30));
            endString = endDate.toISOString().split('T')[0];
        }

        const manualTranId = `MANUAL-${Date.now()}`;
        await conn.query(
            "INSERT INTO subscriptions (business_id, plan_id, plan_type, start_date, end_date, status, tran_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [business_id, plan_id, plan_id == 1 ? 'free' : 'pro', startString, endString, 'active', manualTranId]
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
        res.json({
            success: true,
            message: "Congratulations! Your plan has been upgraded successfully. Please re-login to activate your new permissions.",
            new_plan_id: plan_id,
            start_date: startString,
            end_date: endString
        });

    } catch (error) {
        await conn.rollback();
        logError("plan.selfUpgrade", error, res);
    } finally {
        conn.release();
    }
};

// ============================================================
// STEP 2: Billing History — get all subscription records
// ============================================================
exports.getBillingHistory = async (req, res) => {
    try {
        const { business_id } = req;

        const [history] = await db.query(`
            SELECT 
                s.id,
                s.plan_id,
                p.name          AS plan_name,
                p.price         AS plan_price,
                s.start_date,
                s.end_date,
                s.status,
                s.tran_id,
                DATEDIFF(s.end_date, s.start_date) AS duration_days,
                s.created_at
            FROM subscriptions s
            JOIN subscription_plans p ON s.plan_id = p.id
            WHERE s.business_id = ?
            ORDER BY s.created_at DESC
        `, [business_id]);

        res.json({ success: true, history });
    } catch (error) {
        logError("plan.getBillingHistory", error, res);
    }
};
