const { db, logError } = require("../util/helper");

// 1. Create New Order (The Core Sale Point)
exports.create = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { business_id, branch_id } = req;
        const user_id = req.user_id || null; 
        const {
            customer_name,
            table_no,
            sub_total,
            total_amount,
            payment_method,
            order_type,
            cart_items,
            status: requestStatus
        } = req.body;

        console.log("Creating new order:", {
            business_id, branch_id, user_id, customer_name, table_no, total_amount, itemsCount: cart_items?.length
        });

        // Default status: if guest ordered without paying yet -> 'ordered' or 'unpaid'
        // If POS staff created it (user_id exists) -> usually 'completed' (already paid)
        let order_status = requestStatus || (user_id ? 'completed' : 'ordered');
        if (payment_method === 'Cash' && !user_id) order_status = 'unpaid';

        // A. Insert into Orders Table (Dynamic to handle null user_id)
        const fields = ["business_id", "branch_id", "customer_name", "table_no", "sub_total", "total_amount", "payment_method", "order_type", "status"];
        const values = [business_id, branch_id, customer_name, table_no, sub_total, total_amount, payment_method, order_type, order_status];

        if (user_id) {
            fields.push("user_id");
            values.push(user_id);
        }

        const placeholders = values.map(() => "?").join(", ");
        const [order_res] = await conn.query(
            `INSERT INTO orders (${fields.join(", ")}) VALUES (${placeholders})`,
            values
        );
        const order_id = order_res.insertId;

        // B. Insert Details & Deduct Stock (Recipe Aware)
        for (const item of cart_items) {
            // 1. Insert Detail Record
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.qty) || 1;
            await conn.query(
                "INSERT INTO order_details (order_id, product_id, qty, price, note) VALUES (?, ?, ?, ?, ?)",
                [order_id, item.product_id, itemQty, itemPrice, item.note || ""]
            );

            // 2. [Optional] Fetch Recipe if exists (Commented out until recipes table is created)
            /*
            const [recipe] = await conn.query(
                "SELECT raw_material_id, quantity FROM recipes WHERE product_id = ?",
                [item.product_id]
            );

            if (recipe.length > 0) {
                // Deduct materials
                for (const ingredient of recipe) {
                    await conn.query(
                        "UPDATE raw_materials SET quantity = quantity - ? WHERE id = ?",
                        [ingredient.quantity * item.qty, ingredient.raw_material_id]
                    );
                }
            }
            */
        }

        await conn.commit();
        res.json({ success: true, message: "Order Placed Successfully!", order_id });

    } catch (error) {
        await conn.rollback();
        logError("order.create", error, res);
    } finally {
        conn.release();
    }
};

// 2. Get Order History (SaaS Scope)
exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id, user_id: session_user_id } = req;
        let { from_date, to_date, user_id, txtSearch } = req.query;

        // Scoping: 
        // 1. Admin/Owner can see all orders in business or filter by branch
        // 2. Regular staff can only see their branch orders
        let params = [business_id];
        let sql = `
            SELECT 
                o.*, 
                u.name as staff_name, 
                b.name as branch_name,
                (SELECT GROUP_CONCAT(p.name SEPARATOR ', ') FROM order_details od JOIN products p ON od.product_id = p.id WHERE od.order_id = o.id) as product_names,
                (SELECT SUM(qty) FROM order_details WHERE order_id = o.id) as total_quantity
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.business_id = ? 
        `;

        if (branch_id) {
            sql += " AND o.branch_id = ? ";
            params.push(branch_id);
        }

        if (user_id) {
            sql += " AND o.user_id = ? ";
            params.push(user_id);
        }

        if (from_date && to_date) {
            sql += " AND DATE(o.created_at) BETWEEN ? AND ? ";
            params.push(from_date, to_date);
        }

        if (txtSearch) {
            sql += " AND (o.order_no LIKE ? OR o.customer_name LIKE ?) ";
            params.push(`%${txtSearch}%`, `%${txtSearch}%`);
        }

        sql += " AND o.status != 'cancelled' ";
        sql += " ORDER BY o.id DESC LIMIT 100 ";

        const [list] = await db.query(sql, params);

        // Detailed Summary: Total, Qty, and Breakdown by Payment Method
        const summaryParams = [
            business_id, 
            ...(branch_id ? [branch_id] : []), 
            ...(user_id ? [user_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : []),
            business_id, 
            ...(branch_id ? [branch_id] : []), 
            ...(user_id ? [user_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : [])
        ];

        const [sum] = await db.query(
            `SELECT 
                COUNT(o.id) as total_order, 
                SUM(o.total_amount) as total_amount,
                SUM(CASE WHEN o.payment_method = 'Cash' THEN o.total_amount ELSE 0 END) as total_cash,
                SUM(CASE WHEN o.payment_method = 'ABA' THEN o.total_amount ELSE 0 END) as total_aba,
                SUM(CASE WHEN o.payment_method = 'Wing' THEN o.total_amount ELSE 0 END) as total_wing,
                SUM(CASE WHEN o.payment_method NOT IN ('Cash', 'ABA', 'Wing') THEN o.total_amount ELSE 0 END) as total_other,
                (SELECT SUM(qty) FROM order_details od JOIN orders o2 ON od.order_id = o2.id 
                 WHERE o2.business_id = ? 
                 ${branch_id ? 'AND o2.branch_id = ?' : ''} 
                 ${user_id ? 'AND o2.user_id = ?' : ''}
                 AND o2.status != 'cancelled'
                 ${from_date && to_date ? 'AND DATE(o2.created_at) BETWEEN ? AND ?' : ''}
                ) as total_qty
             FROM orders o
             WHERE o.business_id = ? 
             ${branch_id ? 'AND o.branch_id = ?' : ''} 
             ${user_id ? 'AND o.user_id = ?' : ''}
             AND o.status != 'cancelled'
             ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}`,
            summaryParams
        );

        // Fetch Expenses for the same period and scope
        const expenseParams = [
            business_id,
            ...(branch_id ? [branch_id] : []),
            ...(from_date && to_date ? [from_date, to_date] : [])
        ];
        const [expenses] = await db.query(
            `SELECT 
                SUM(amount) as total_expense,
                SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END) as total_cash_expense
             FROM expense
             WHERE business_id = ? 
             ${branch_id ? 'AND branch_id = ?' : ''} 
             ${from_date && to_date ? 'AND DATE(expense_date) BETWEEN ? AND ?' : ''}`,
            expenseParams
        );

        // Fetch Top Selling Products
        const [topProducts] = await db.query(
            `SELECT p.name, SUM(od.qty) as total_qty
             FROM order_details od
             JOIN products p ON od.product_id = p.id
             JOIN orders o ON od.order_id = o.id
             WHERE o.business_id = ? 
             ${branch_id ? 'AND o.branch_id = ?' : ''} 
             ${from_date && to_date ? 'AND DATE(o.created_at) BETWEEN ? AND ?' : ''}
             AND o.status != 'cancelled'
             GROUP BY p.id
             ORDER BY total_qty DESC
             LIMIT 5`,
            expenseParams // Same params as expenses (business_id, branch_id, date range)
        );

        res.json({
            list,
            summary: {
                ...(sum[0] || {}),
                total_expense: expenses[0]?.total_expense || 0,
                total_cash_expense: expenses[0]?.total_cash_expense || 0,
                top_products: topProducts
            }
        });
    } catch (error) {
        logError("order.getList", error, res);
    }
};

// 3. Get Order Details
exports.getOrderDetail = async (req, res) => {
    try {
        const { order_id } = req.params;
        const { business_id } = req;
        
        console.log("Fetching order details for ID:", order_id, "User Business ID:", business_id);

        const [order_check] = await db.query("SELECT id, business_id FROM orders WHERE id = ?", [order_id]);
        if (order_check.length > 0) {
            console.log("Order found in DB:", order_check[0]);
        } else {
            console.log("Order NOT found in DB with ID:", order_id);
        }

        const [order] = await db.query("SELECT * FROM orders WHERE id = ? AND business_id = ?", [order_id, business_id]);

        if (order.length === 0) {
            console.log("Order access denied or not found:", { order_id, business_id });
            return res.json({
                details: [],
                order: null,
                message: "Order not found or access denied"
            });
        }

        const [list] = await db.query(
            `SELECT od.*, p.name as product_name, p.image, c.name as category_name
             FROM order_details od
             LEFT JOIN products p ON od.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE od.order_id = ?`,
            [order_id]
        );

        console.log("Order details successfully fetched. Count:", list.length);

        res.json({
            details: list,
            order: order[0]
        });
    } catch (error) {
        logError("order.getOrderDetail", error, res);
    }
};

// 4. Get Pending Orders (Dine In)
exports.getPendingOrders = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const [list] = await db.query(
            "SELECT * FROM orders WHERE business_id = ? AND branch_id = ? AND status = 'unpaid' AND order_type = 'dine_in' ORDER BY id DESC",
            [business_id, branch_id]
        );
        res.json({ list });
    } catch (error) {
        logError("order.getPendingOrders", error, res);
    }
};

// 5. Update Status
exports.updateStatus = async (req, res) => {
    try {
        const { id, order_id, status } = req.body;
        const targetId = id || order_id;
        const { business_id } = req;
        await db.query("UPDATE orders SET status = ? WHERE id = ? AND business_id = ?", [status, targetId, business_id]);
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        logError("order.updateStatus", error, res);
    }
};
