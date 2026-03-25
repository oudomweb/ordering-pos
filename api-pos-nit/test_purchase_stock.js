const { db } = require("./src/util/helper");

async function testPurchase() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const business_id = 1; // Example Business
        const branch_id = 1;   // Example Branch
        const user_id = 1;

        // 1. Get raw material ID for "Coffee Powder"
        const [rms] = await conn.query("SELECT id FROM raw_material WHERE name LIKE '%Coffee%' LIMIT 1");
        if (rms.length === 0) {
            console.log("Please create 'Coffee Powder' in raw_materials first.");
            process.exit(0);
        }
        const rm_id = rms[0].id;

        // 2. Perform Purchase 5 units (5kg for example)
        console.log(`Simulating Purchase for RM ID: ${rm_id}...`);

        // This simulates the behavior of purchase.controller.js we just updated
        const ref = `PO-TEST-${Date.now()}`;
        const cost = 10; // $10/kg
        const qty = 5;

        // A. Insert Purchase
        const [p_res] = await conn.query(
            "INSERT INTO purchase (business_id, branch_id, supplier_id, ref, total_amount, paid_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [business_id, branch_id, 1, ref, cost * qty, cost * qty, user_id]
        );

        // B. Update Stock & Log (Manual simulation of Controller logic)
        const [oldData] = await conn.query("SELECT qty FROM raw_material WHERE id = ?", [rm_id]);
        const old_qty = oldData[0].qty;
        const new_qty = old_qty + qty;

        await conn.query("UPDATE raw_material SET qty = qty + ? WHERE id = ?", [qty, rm_id]);

        await conn.query(`
            INSERT INTO stock_logs (business_id, branch_id, item_type, item_id, old_qty, new_qty, qty_changed, type, ref_id, reason, created_by)
            VALUES (?, ?, 'raw_material', ?, ?, ?, ?, 'purchase', ?, 'Supplier Purchase Test', ?)
        `, [business_id, branch_id, rm_id, old_qty, new_qty, qty, ref, user_id]);

        await conn.commit();
        console.log(`✅ Success! Purchase ${qty} added to stock. New Qty: ${new_qty}`);
        process.exit(0);
    } catch (e) {
        await conn.rollback();
        console.error(e);
        process.exit(1);
    } finally {
        conn.release();
    }
}
testPurchase();
