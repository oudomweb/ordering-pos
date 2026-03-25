const { db } = require("./src/util/helper");

async function runDemo() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const business_id = 1;
        const branch_id = 1;

        // --- 1. PURCHASE COFFEE POWDER (1kg) ---
        const [rms] = await conn.query("SELECT id, qty FROM raw_material WHERE name='Coffee Powder' LIMIT 1");
        const rm_id = rms[0].id;
        const purchase_qty = 1.0;
        console.log(`Step 1: Purchasing ${purchase_qty}kg of Coffee Powder...`);

        await conn.query("UPDATE raw_material SET qty = qty + ? WHERE id = ?", [purchase_qty, rm_id]);
        await conn.query(`
            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, reason)
            VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'purchase', 'Test Purchase 1kg')
        `, [business_id, branch_id, rm_id, rms[0].qty, rms[0].qty + purchase_qty, purchase_qty]);

        // --- 2. ORDER 10 LATTES ---
        const [ps] = await conn.query("SELECT id FROM products WHERE name='Latte Coffee' LIMIT 1");
        const product_id = ps[0].id;
        const order_qty = 10;
        console.log(`Step 2: Selling ${order_qty} Lattes...`);

        // Simulate logic of new order.controller.js
        const [recipe] = await conn.query("SELECT raw_material_id, qty FROM recipe_detail WHERE product_id = ?", [product_id]);
        for (const ing of recipe) {
            const totalDeduct = ing.qty * order_qty; // 0.02 * 10 = 0.2

            const [old_stk] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [ing.raw_material_id]);
            const old_qty = old_stk[0].qty;
            const new_qty = old_qty - totalDeduct;

            await conn.query("UPDATE raw_material SET qty = ? WHERE id = ?", [new_qty, ing.raw_material_id]);

            await conn.query(`
                INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, reason)
                VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'sale', 'POS Sale 10 Lattes')
            `, [business_id, branch_id, ing.raw_material_id, old_qty, new_qty, -totalDeduct]);
        }

        await conn.commit();

        // --- 3. FINAL REPORT ---
        const [final] = await conn.query("SELECT name, qty, unit FROM raw_material WHERE id = ?", [rm_id]);
        console.log("\n--- FINAL STOCK REPORT ---");
        console.log(`Item: ${final[0].name}`);
        console.log(`Remaining Qty: ${final[0].qty} ${final[0].unit}`);
        console.log("--------------------------");

        process.exit(0);
    } catch (e) {
        await conn.rollback();
        console.error(e);
        process.exit(1);
    } finally {
        conn.release();
    }
}
runDemo();
