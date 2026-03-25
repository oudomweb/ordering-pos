const { db, logError } = require("../util/helper");

// 1. Get Expense Types for Business
exports.getExpenseTypes = async (req, res) => {
    try {
        const { business_id } = req;
        const [list] = await db.query("SELECT id as value, name as label FROM expense_type WHERE business_id = ?", [business_id]);
        res.json({ list });
    } catch (error) {
        logError("expense.getExpenseTypes", error, res);
    }
};

// 2. Create Expense Type
exports.createExpenseType = async (req, res) => {
    try {
        const { business_id } = req;
        const { name } = req.body;
        const [data] = await db.query("INSERT INTO expense_type (business_id, name) VALUES (?, ?)", [business_id, name]);
        res.json({ success: true, message: "Expense type created!", data });
    } catch (error) {
        logError("expense.createExpenseType", error, res);
    }
};

// 3. Get Expense List (Filtered by Business/Branch)
exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { txtSearch, expense_type_id, from_date, to_date } = req.query;

        let sql = `
      SELECT e.*, et.name as expense_type_name, b.name as branch_name
      FROM expense e
      LEFT JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN branches b ON e.branch_id = b.id
      WHERE e.business_id = ?
    `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND e.branch_id = ?";
            params.push(branch_id);
        }
        if (expense_type_id) {
            sql += " AND e.expense_type_id = ?";
            params.push(expense_type_id);
        }
        if (from_date && to_date) {
            sql += " AND e.expense_date BETWEEN ? AND ?";
            params.push(from_date, to_date);
        }
        if (txtSearch) {
            sql += " AND e.description LIKE ?";
            params.push(`%${txtSearch}%`);
        }

        sql += " ORDER BY e.expense_date DESC, e.id DESC";

        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("expense.getList", error, res);
    }
};

// 4. Create Expense
exports.create = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { expense_type_id, amount, payment_method, description, expense_date } = req.body;

        const [data] = await db.query(
            "INSERT INTO expense (business_id, branch_id, expense_type_id, amount, payment_method, description, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [business_id, branch_id, expense_type_id, amount, payment_method || 'Cash', description, expense_date]
        );

        res.json({ success: true, message: "Expense recorded!", data });
    } catch (error) {
        logError("expense.create", error, res);
    }
};

// 5. Update Expense
exports.update = async (req, res) => {
    try {
        const { business_id } = req;
        const { id, expense_type_id, amount, payment_method, description, expense_date } = req.body;
        await db.query(
            "UPDATE expense SET expense_type_id=?, amount=?, payment_method=?, description=?, expense_date=? WHERE id=? AND business_id=?",
            [expense_type_id, amount, payment_method || 'Cash', description, expense_date, id, business_id]
        );
        res.json({ success: true, message: "Expense updated!" });
    } catch (error) {
        logError("expense.update", error, res);
    }
}

// 6. Remove Expense
exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;
        await db.query("DELETE FROM expense WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ success: true, message: "Expense removed!" });
    } catch (error) {
        logError("expense.remove", error, res);
    }
};
