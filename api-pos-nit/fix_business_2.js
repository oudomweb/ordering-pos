const { db } = require("./src/util/helper");

async function fixForBusiness2() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const b_id = 2; // Business ID from "It sruk srae"
        const br_id = 3; // Branch ID (Main Branch)
        const u_id = 3; // User ID

        // 1. Create categories that the UI expects
        console.log("Creating categories for Business 2...");
        const categories = ["Coffee", "Juice", "Milk", "Snack", "Rice", "Dessert"];
        const catMap = {};
        for (const name of categories) {
            const [res] = await conn.query("INSERT INTO categories (business_id, name) VALUES (?, ?)", [b_id, name]);
            catMap[name] = res.insertId;
        }

        // 2. Create Raw Material (Coffee Powder)
        console.log("Creating 'Coffee Powder' for Business 2...");
        const [rm_res] = await conn.query(
            "INSERT INTO raw_material (business_id, branch_id, name, unit, price, qty, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [b_id, br_id, 'Coffee Powder', 'kg', 12.00, 5.00, 2] // Start with 5kg
        );
        const rm_id = rm_res.insertId;

        // 3. Create Product (Latte) under "Coffee" category
        console.log("Creating 'Latte Coffee' Drink for Business 2...");
        const [p_res] = await conn.query(
            "INSERT INTO products (business_id, category_id, name) VALUES (?, ?, ?)",
            [b_id, catMap["Coffee"], 'Latte Coffee']
        );
        const product_id = p_res.insertId;

        // Add to branch
        await conn.query(
            "INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)",
            [br_id, product_id, 2.50, 0.80, 0]
        );

        // 4. Create Recipe (1 Latte = 0.02kg Coffee)
        console.log("Setting Recipe: 1 Latte = 0.02kg Coffee...");
        await conn.query(
            "INSERT INTO recipe_detail (product_id, raw_material_id, qty, unit) VALUES (?, ?, ?, ?)",
            [product_id, rm_id, 0.02, 'kg']
        );

        await conn.commit();
        console.log("✅ Success! Business 2 is now ready for POS with Coffee, Juice, etc.");
        process.exit(0);
    } catch (e) {
        await conn.rollback();
        console.error("Setup failed:", e);
        process.exit(1);
    } finally {
        conn.release();
    }
}
fixForBusiness2();
