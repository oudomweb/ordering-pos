const { logError } = require("./logError");

exports.processStockDeduction = async (connection, orderId, orderNo, items, userId) => {
    try {
        for (const item of items) {
            const productId = item.product_id;
            const quantity = Number(item.quantity) || 0;

            if (!productId || quantity <= 0) continue;

            // 1. Check Product Type
            const [products] = await connection.query("SELECT product_type, name FROM product WHERE id = ?", [productId]);
            if (products.length === 0) continue;

            const product = products[0];
            const productType = product.product_type || 'ready';

            if (productType === 'recipe') {
                // 2. Handle Recipe (Deduct Raw Materials)
                const [ingredients] = await connection.query("SELECT * FROM recipe_detail WHERE product_id = ?", [productId]);

                for (const ing of ingredients) {
                    const deductQty = Number(ing.qty) * quantity;

                    // Deduct Raw Material Stock
                    await connection.query("UPDATE raw_material SET qty = qty - ? WHERE id = ?", [deductQty, ing.raw_material_id]);

                    // Log Movement
                    await connection.query(`
            INSERT INTO stock_movement 
            (stock_type, raw_material_id, qty, description, ref_id, ref_type, created_at, created_by) 
            VALUES 
            ('OUT', ?, ?, ?, ?, 'order', NOW(), ?)
          `, [
                        ing.raw_material_id,
                        deductQty,
                        `Used for order ${orderNo} (${product.name})`,
                        orderId,
                        userId
                    ]);
                }
            } else {
                // 3. Handle Ready Product (Deduct Product Stock directly)
                await connection.query("UPDATE product SET qty = qty - ? WHERE id = ?", [quantity, productId]);

                // Log Movement
                await connection.query(`
            INSERT INTO stock_movement 
            (stock_type, product_id, qty, description, ref_id, ref_type, created_at, created_by) 
            VALUES 
            ('OUT', ?, ?, ?, ?, 'order', NOW(), ?)
          `, [
                    productId,
                    quantity,
                    `Sold in order ${orderNo}`,
                    orderId,
                    userId
                ]);
            }
        }
    } catch (error) {
        console.error("Stock Deduction Error:", error);
        throw error; // Propagate error to rollback transaction
    }
};
