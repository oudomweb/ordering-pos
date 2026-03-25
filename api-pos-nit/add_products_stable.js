
const mysql = require("mysql2/promise");

async function run() {
    const categoriesToAdd = [
        {
            cat: 'Juice', products: [
                { name: 'Fresh Orange Juice', price: 2.5, img: 'juice_cat.png' },
                { name: 'Apple Juice Delight', price: 2.5, img: 'juice_cat.png' },
                { name: 'Watermelon Splash', price: 2.5, img: 'juice_cat.png' },
                { name: 'Pineapple Glow', price: 2.5, img: 'juice_cat.png' },
                { name: 'Tropical Mixed Juice', price: 3.0, img: 'juice_cat.png' }
            ]
        },
        {
            cat: 'Milk', products: [
                { name: 'Pure Fresh Milk', price: 2.0, img: 'milk_cat.png' },
                { name: 'Soy Milk Classic', price: 2.5, img: 'milk_cat.png' },
                { name: 'Almond Milk Silky', price: 3.0, img: 'milk_cat.png' },
                { name: 'Strawberry Milk Dream', price: 2.5, img: 'milk_cat.png' },
                { name: 'Rich Chocolate Milk', price: 2.5, img: 'milk_cat.png' }
            ]
        },
        {
            cat: 'Snack', products: [
                { name: 'Chocolate Cookies', price: 1.5, img: 'snack_cat.png' },
                { name: 'Potato Chips', price: 1.5, img: 'snack_cat.png' },
                { name: 'Butter Popcorn', price: 2.0, img: 'snack_cat.png' },
                { name: 'Spicy Nachos', price: 3.5, img: 'snack_cat.png' },
                { name: 'Fudge Brownie', price: 2.5, img: 'snack_cat.png' }
            ]
        },
        {
            cat: 'Rice', products: [
                { name: 'Shrimp Fried Rice', price: 4.5, img: 'rice_cat.png' },
                { name: 'Golden Steam Rice', price: 1.0, img: 'rice_cat.png' },
                { name: 'Garlic Rice', price: 1.5, img: 'rice_cat.png' },
                { name: 'Pineapple Rice', price: 5.0, img: 'rice_cat.png' },
                { name: 'Holy Basil Rice', price: 4.0, img: 'rice_cat.png' }
            ]
        },
        {
            cat: 'Dessert', products: [
                { name: 'New York Cheesecake', price: 3.5, img: 'dessert_cat.png' },
                { name: 'Tiramisu Cup', price: 4.0, img: 'dessert_cat.png' },
                { name: 'Mango Sticky Rice', price: 3.5, img: 'dessert_cat.png' },
                { name: 'Premium Ice Cream', price: 2.5, img: 'dessert_cat.png' },
                { name: 'Delicate Fruit Tart', price: 3.0, img: 'dessert_cat.png' }
            ]
        }
    ];

    for (const group of categoriesToAdd) {
        console.log(`Processing category: ${group.cat}`);
        let connection;
        try {
            connection = await mysql.createConnection("mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway");
            const bizId = 5;
            const branchId = 6;

            const [cats] = await connection.execute("SELECT id FROM categories WHERE name = ? AND business_id = ?", [group.cat, bizId]);
            if (cats.length === 0) {
                console.log(`Category ${group.cat} not found. skipping.`);
                continue;
            }
            const catId = cats[0].id;

            for (const p of group.products) {
                // Check if exists
                const [rows] = await connection.execute("SELECT id FROM products WHERE name = ? AND business_id = ?", [p.name, bizId]);
                if (rows.length > 0) {
                    console.log(`- Product ${p.name} exists. Skipping.`);
                    continue;
                }

                const [pRes] = await connection.execute(
                    "INSERT INTO products (business_id, category_id, name, image, status, discount) VALUES (?, ?, ?, ?, ?, ?)",
                    [bizId, catId, p.name, p.img, 1, 0]
                );
                const productId = pRes.insertId;

                await connection.execute(
                    "INSERT INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, ?)",
                    [branchId, productId, p.price, p.price * 0.5, 100]
                );
                console.log(`- Added ${p.name}`);
            }
        } catch (err) {
            console.error(`- Error in ${group.cat}: ${err.message}`);
        } finally {
            if (connection) await connection.end();
        }
    }
}

run();
