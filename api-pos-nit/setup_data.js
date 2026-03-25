const { db } = require("./src/util/helper");

async function setupRecipe() {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const business_id = 1;
        const branch_id = 1;

        // 1. Create Category
        console.log("Creating 'Beverages' Category...");
        const [cat] = await conn.query(
            "INSERT INTO categories (business_id, name) VALUES (?, ?)",
            [business_id, 'Beverages']
        );
        const cat_id = cat.insertId;

        // 2. Create Raw Material (Coffee Powder)
        console.log("Creating 'Coffee Powder'...");
        const [rm_res] = await conn.query(
            "INSERT INTO raw_material (business_id, branch_id, name, unit, price, qty, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [business_id, branch_id, 'Coffee Powder', 'kg', 12.00, 0, 2]
        );
        const rm_id = rm_res.insertId;

        // 3. Create Product (Latte)
        console.log("Creating 'Latte Coffee' Drink...");
        const [p_res] = await conn.query(
            "INSERT INTO products (business_id, category_id, name) VALUES (?, ?, ?)",
            [business_id, cat_id, 'Latte Coffee']
        );
        const product_id = p_res.insertId;

        // Add to branch
        await conn.query(
            "INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)",
            [branch_id, product_id, 2.50, 0.80, 0]
        );

        // 4. Create Recipe (1 Latte = 0.02kg Coffee)
        console.log("Setting Recipe: 1 Latte = 0.02kg Coffee...");
        await conn.query(
            "INSERT INTO recipe_detail (product_id, raw_material_id, qty, unit) VALUES (?, ?, ?, ?)",
            [product_id, rm_id, 0.02, 'kg']
        );

        await conn.commit();
        console.log("✅ Success! Full Recipe Setup Done.");
        process.exit(0);
    } catch (e) {
        await conn.rollback();
        console.error(e);
        process.exit(1);
    } finally {
        conn.release();
    }
}
setupRecipe();
