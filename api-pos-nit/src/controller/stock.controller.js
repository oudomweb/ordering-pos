const { db, logError } = require("../util/helper");

// GET /api/stock/logs — View History
exports.getLogs = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { item_type, type, from_date, to_date } = req.query;

        let sql = `
            SELECT l.*, u.name as staff_name, 
                   CASE l.item_type 
                        WHEN 'product' THEN p.name 
                        WHEN 'raw_material' THEN rm.name 
                   END as item_name
            FROM stock_logs l
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN products p ON l.item_type = 'product' AND l.item_id = p.id
            LEFT JOIN raw_material rm ON l.item_type = 'raw_material' AND l.item_id = rm.id
            WHERE l.business_id = ?
        `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND l.branch_id = ?";
            params.push(branch_id);
        }
        if (item_type) {
            sql += " AND l.item_type = ?";
            params.push(item_type);
        }
        if (type) {
            sql += " AND l.type = ?";
            params.push(type);
        }

        sql += " ORDER BY l.id DESC LIMIT 200";
        const [logs] = await db.query(sql, params);
        res.json({ logs });
    } catch (error) {
        logError("stock.getLogs", error, res);
    }
};

// POST /api/stock/adjust — Manual Correction
exports.adjustStock = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id, user_id } = req;
        const { item_type, item_id, qty_changed, type, reason } = req.body;
        // type: 'adjustment' (for corrections), 'waste' (for spills/spoiled)

        if (item_type === 'raw_material') {
            const [rm] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [item_id]);
            const old_qty = rm[0]?.qty || 0;
            const new_qty = old_qty + parseFloat(qty_changed); // qty_changed can be negative (e.g. -2 for waste)

            await conn.query("UPDATE raw_material SET qty = ? WHERE id = ?", [new_qty, item_id]);

            await conn.query(`
                INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, reason, created_by)
                VALUES (?, ?, 'raw_material', ?, ?, ?, ?, ?, ?, ?)
            `, [business_id, branch_id, item_id, old_qty, new_qty, qty_changed, type, reason, user_id]);

        } else {
            const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item_id, branch_id]);
            const old_qty = bp[0]?.stock_qty || 0;
            const new_qty = old_qty + parseFloat(qty_changed);

            await conn.query("UPDATE branch_products SET stock_qty = ? WHERE product_id = ? AND branch_id = ?", [new_qty, item_id, branch_id]);

            await conn.query(`
                INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, reason, created_by)
                VALUES (?, ?, 'product', ?, ?, ?, ?, ?, ?, ?)
            `, [business_id, branch_id, item_id, old_qty, new_qty, qty_changed, type, reason, user_id]);
        }

        await conn.commit();
        res.json({ success: true, message: `Stock adjusted successfully (${type})` });
    } catch (error) {
        await conn.rollback();
        logError("stock.adjustStock", error, res);
    } finally {
        conn.release();
    }
};
