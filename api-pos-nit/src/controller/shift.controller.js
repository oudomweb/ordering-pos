const { db, logError } = require("../util/helper");

// 1. Create (Close) Shift
exports.create = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const {
            id, // ID of the existing open shift
            opening_cash_usd,
            opening_cash_khr,
            actual_cash_usd,
            actual_cash_khr,
            expected_cash_usd,
            total_sales_usd,
            total_cash_usd,
            total_aba_usd,
            total_wing_usd,
            total_expense_usd,
            diff_usd,
            remark
        } = req.body;

        let sql = "";
        let values = [];

        if (id) {
            // Update existing open shift to closed
            sql = `
                UPDATE shifts SET 
                    actual_cash_usd = ?, actual_cash_khr = ?, 
                    expected_cash_usd = ?, total_sales_usd = ?, 
                    total_cash_usd = ?, total_aba_usd = ?, 
                    total_wing_usd = ?, total_expense_usd = ?, 
                    diff_usd = ?, remark = ?, status = 'Closed', 
                    closed_at = CURRENT_TIMESTAMP
                WHERE id = ? AND business_id = ?
            `;
            values = [
                actual_cash_usd || 0, actual_cash_khr || 0,
                expected_cash_usd || 0, total_sales_usd || 0,
                total_cash_usd || 0, total_aba_usd || 0,
                total_wing_usd || 0, total_expense_usd || 0, 
                diff_usd || 0, remark || null,
                id, business_id
            ];
        } else {
            // Create a new closed shift (for backward compatibility or direct creation)
            sql = `
                INSERT INTO shifts (
                    business_id, branch_id, user_id, 
                    opening_cash_usd, opening_cash_khr, 
                    actual_cash_usd, actual_cash_khr, 
                    expected_cash_usd, total_sales_usd, 
                    total_cash_usd, total_aba_usd, total_wing_usd, total_expense_usd, 
                    diff_usd, remark, status, closed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Closed', CURRENT_TIMESTAMP)
            `;
            values = [
                business_id, branch_id, user_id,
                opening_cash_usd || 0, opening_cash_khr || 0,
                actual_cash_usd || 0, actual_cash_khr || 0,
                expected_cash_usd || 0, total_sales_usd || 0,
                total_cash_usd || 0, total_aba_usd || 0, total_wing_usd || 0, total_expense_usd || 0, 
                diff_usd || 0, remark || null
            ];
        }

        const [result] = await db.query(sql, values);
        res.json({
            success: true,
            message: "Shift closed and saved successfully!",
            id: id || result.insertId
        });
    } catch (error) {
        logError("shift.create", error, res);
    }
};

// 2. Open Shift
exports.openShift = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const { opening_cash_usd, opening_cash_khr } = req.body;

        // Check if there's already an open shift for this user/branch
        const [existing] = await db.query(
            "SELECT id FROM shifts WHERE business_id = ? AND branch_id = ? AND user_id = ? AND status = 'Open' LIMIT 1",
            [business_id, branch_id, user_id]
        );

        if (existing.length > 0) {
            return res.json({
                success: false,
                message: "You already have an open shift!",
                id: existing[0].id
            });
        }

        const sql = `
            INSERT INTO shifts (
                business_id, branch_id, user_id, 
                opening_cash_usd, opening_cash_khr, 
                status
            ) VALUES (?, ?, ?, ?, ?, 'Open')
        `;
        const values = [business_id, branch_id, user_id, opening_cash_usd || 0, opening_cash_khr || 0];
        const [result] = await db.query(sql, values);

        res.json({
            success: true,
            message: "Shift opened successfully!",
            id: result.insertId
        });
    } catch (error) {
        logError("shift.open", error, res);
    }
};

// 3. Get Current Open Shift
exports.getCurrentShift = async (req, res) => {
    try {
        const { business_id, branch_id, user_id } = req;
        const [list] = await db.query(
            "SELECT * FROM shifts WHERE business_id = ? AND branch_id = ? AND user_id = ? AND status = 'Open' ORDER BY id DESC LIMIT 1",
            [business_id, branch_id, user_id]
        );
        res.json({
            success: true,
            data: list.length > 0 ? list[0] : null
        });
    } catch (error) {
        logError("shift.getCurrentShift", error, res);
    }
};

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { from_date, to_date, user_id } = req.query;

        let sql = `
            SELECT s.*, u.name as staff_name, r.name as role_name 
            FROM shifts s 
            LEFT JOIN users u ON s.user_id = u.id 
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE s.business_id = ?
        `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND s.branch_id = ? ";
            params.push(branch_id);
        }

        if (user_id) {
            sql += " AND s.user_id = ? ";
            params.push(user_id);
        }

        if (from_date && to_date) {
            sql += " AND DATE(s.created_at) BETWEEN ? AND ? ";
            params.push(from_date, to_date);
        }

        sql += " ORDER BY s.id DESC ";

        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("shift.getList", error, res);
    }
};
