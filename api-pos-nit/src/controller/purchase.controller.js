const { db, logError, isArray } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { txtSearch } = req.query;

        let sql = `
      SELECT p.*, s.name as supplier_name, b.name as branch_name
      FROM purchase p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN branches b ON p.branch_id = b.id
      WHERE p.business_id = ?
    `;
        let params = [business_id];

        if (branch_id) {
            sql += " AND p.branch_id = ? ";
            params.push(branch_id);
        }

        if (txtSearch) {
            sql += " AND (p.ref LIKE ? OR s.name LIKE ?)";
            params.push(`%${txtSearch}%`, `%${txtSearch}%`);
        }

        sql += " ORDER BY p.id DESC";
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("purchase.getList", error, res);
    }
};

exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id, user_id } = req;
        const {
            supplier_id,
            total_amount,
            paid_amount,
            note,
            purchase_date,
            status, // Pending, Received, etc.
            items // [{ product_id, qty, cost, item_type }]
        } = req.body;

        const ref = `PO-${Date.now()}`;

        // 1. Create Purchase record
        const [p_res] = await conn.query(
            "INSERT INTO purchase (business_id, branch_id, supplier_id, ref, total_amount, paid_amount, note, purchase_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [business_id, branch_id, supplier_id, ref, total_amount, paid_amount, note, purchase_date || new Date(), status || 'Pending', user_id]
        );
        const purchase_id = p_res.insertId;

        // 2. Add items and update inventory (ONLY if status is Received)
        if (items && isArray(items)) {
            for (const item of items) {
                const type = item.item_type || 'product';
                const isRM = type === 'raw_material';

                // A. Insert detail
                await conn.query(
                    `INSERT INTO purchase_product (purchase_id, product_id, raw_material_id, qty, received_qty, cost) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        purchase_id,
                        isRM ? null : item.product_id,
                        isRM ? item.product_id : null,
                        item.qty,
                        status === 'Received' ? item.qty : 0,
                        item.cost
                    ]
                );

                // B. Update Stock ONLY if status is Received
                if (status === 'Received') {
                    if (isRM) {
                        const [rm] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [item.product_id]);
                        const old_qty = rm[0]?.qty || 0;
                        const new_qty = old_qty + item.qty;

                        await conn.query(
                            "UPDATE raw_material SET qty = qty + ? WHERE id = ?",
                            [item.qty, item.product_id]
                        );

                        await conn.query(`
                            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                            VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'purchase', ?, 'Supplier Purchase', ?)
                        `, [business_id, branch_id, item.product_id, old_qty, new_qty, item.qty, ref, user_id]);

                    } else {
                        const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item.product_id, branch_id]);
                        const old_qty = bp[0]?.stock_qty || 0;
                        const new_qty = old_qty + item.qty;

                        await conn.query(
                            `INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) 
                             VALUES (?, ?, ?, ?, ?) 
                             ON DUPLICATE KEY UPDATE 
                             stock_qty = stock_qty + VALUES(stock_qty),
                             cost_price = VALUES(cost_price)`,
                            [branch_id, item.product_id, item.cost * 1.5, item.cost, item.qty]
                        );

                        await conn.query(`
                            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                            VALUES (?, ?, 'product', ?, ?, ?, ?, 'purchase', ?, 'Supplier Purchase', ?)
                        `, [business_id, branch_id, item.product_id, old_qty, new_qty, item.qty, ref, user_id]);
                    }
                }
            }
        }

        await conn.commit();
        res.json({ success: true, message: "Purchase created and stock updated!", ref });
    } catch (error) {
        await conn.rollback();
        logError("purchase.create", error, res);
    } finally {
        conn.release();
    }
};

exports.getDetails = async (req, res) => {
    try {
        const { id } = req.query;
        // Fetch items with names from both tables
        const [items] = await db.query(`
            SELECT 
                pp.*,
                COALESCE(p.name, rm.name) as name,
                CASE WHEN pp.raw_material_id IS NOT NULL THEN 'raw_material' ELSE 'product' END as item_type
            FROM purchase_product pp
            LEFT JOIN products p ON pp.product_id = p.id
            LEFT JOIN raw_material rm ON pp.raw_material_id = rm.id
            WHERE pp.purchase_id = ?
        `, [id]);
        res.json({ list: items });
    } catch (error) {
        logError("purchase.getDetails", error, res);
    }
};

exports.receive = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id, user_id } = req;
        const { purchase_id, items } = req.body; // items: [{ id (pp_id), receive_now, item_type, real_id }]

        const [p_rows] = await conn.query("SELECT ref FROM purchase WHERE id = ?", [purchase_id]);
        const ref = p_rows[0]?.ref || `RCV-${Date.now()}`;

        for (const item of items) {
            if (item.receive_now > 0) {
                // 1. Update purchase_product
                await conn.query(
                    "UPDATE purchase_product SET received_qty = received_qty + ? WHERE id = ?",
                    [item.receive_now, item.id]
                );

                // 2. Update stock
                if (item.item_type === 'raw_material') {
                    const [rm] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [item.real_id]);
                    const old_qty = rm[0]?.qty || 0;
                    const new_qty = old_qty + item.receive_now;

                    await conn.query("UPDATE raw_material SET qty = qty + ? WHERE id = ?", [item.receive_now, item.real_id]);

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'receive', ?, 'Supplier Goods Received', ?)
                    `, [business_id, branch_id, item.real_id, old_qty, new_qty, item.receive_now, ref, user_id]);
                } else {
                    const [bp] = await conn.query("SELECT stock_qty FROM branch_products WHERE product_id = ? AND branch_id = ?", [item.real_id, branch_id]);
                    const old_qty = bp[0]?.stock_qty || 0;
                    const new_qty = old_qty + item.receive_now;

                    const [pp_rows] = await conn.query("SELECT cost FROM purchase_product WHERE id = ?", [item.id]);
                    const cost = pp_rows[0]?.cost || 0;
                    await conn.query(
                        `INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) 
                         VALUES (?, ?, ?, ?, ?) 
                         ON DUPLICATE KEY UPDATE 
                         stock_qty = stock_qty + VALUES(stock_qty),
                         cost_price = VALUES(cost_price)`,
                        [branch_id, item.real_id, cost * 1.5, cost, item.receive_now]
                    );

                    await conn.query(`
                        INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
                        VALUES (?, ?, 'product', ?, ?, ?, ?, 'receive', ?, 'Supplier Goods Received', ?)
                    `, [business_id, branch_id, item.real_id, old_qty, new_qty, item.receive_now, ref, user_id]);
                }
            }
        }

        // Check if all items fully received to update status
        const [all_items] = await conn.query("SELECT qty, received_qty FROM purchase_product WHERE purchase_id = ?", [purchase_id]);
        const isFull = all_items.every(i => Number(i.received_qty) >= Number(i.qty));
        const isSome = all_items.some(i => Number(i.received_qty) > 0);

        let newStatus = 'Pending';
        if (isFull) newStatus = 'Received';
        else if (isSome) newStatus = 'Partial';

        await conn.query("UPDATE purchase SET status = ? WHERE id = ?", [newStatus, purchase_id]);

        await conn.commit();
        res.json({ success: true, message: "Purchase items received and stock updated!" });
    } catch (error) {
        await conn.rollback();
        logError("purchase.receive", error, res);
    } finally {
        conn.release();
    }
};

exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;
        await db.query("DELETE FROM purchase WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ message: "Purchase record removed!" });
    } catch (error) {
        logError("purchase.remove", error, res);
    }
}
