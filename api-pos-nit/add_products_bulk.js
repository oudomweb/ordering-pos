
const mysql = require("mysql2/promise");

async function addProducts() {
    const connection = await mysql.createConnection("mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway");
    try {
        const bizId = 5;
        const branchId = 6;

        // Get categories mapping
        const [cats] = await connection.execute("SELECT id, name FROM categories WHERE business_id = ?", [bizId]);
        const catMap = {};
        cats.forEach(c => catMap[c.name] = c.id);

        const productData = [
            { cat: 'Juice', name: 'Fresh Orange Juice', price: 2.5, img: 'juice_cat.png' },
            { cat: 'Juice', name: 'Apple Juice Delight', price: 2.5, img: 'juice_cat.png' },
            { cat: 'Juice', name: 'Watermelon Splash', price: 2.5, img: 'juice_cat.png' },
            { cat: 'Juice', name: 'Pineapple Glow', price: 2.5, img: 'juice_cat.png' },
            { cat: 'Juice', name: 'Tropical Mixed Juice', price: 3.0, img: 'juice_cat.png' },

            { cat: 'Milk', name: 'Pure Fresh Milk', price: 2.0, img: 'milk_cat.png' },
            { cat: 'Milk', name: 'Soy Milk Classic', price: 2.5, img: 'milk_cat.png' },
            { cat: 'Milk', name: 'Almond Milk Silky', price: 3.0, img: 'milk_cat.png' },
            { cat: 'Milk', name: 'Strawberry Milk Dream', price: 2.5, img: 'milk_cat.png' },
            { cat: 'Milk', name: 'Rich Chocolate Milk', price: 2.5, img: 'milk_cat.png' },

            { cat: 'Snack', name: 'Chocolate Cookies', price: 1.5, img: 'snack_cat.png' },
            { cat: 'Snack', name: 'Potato Chips', price: 1.5, img: 'snack_cat.png' },
            { cat: 'Snack', name: 'Butter Popcorn', price: 2.0, img: 'snack_cat.png' },
            { cat: 'Snack', name: 'Spicy Nachos', price: 3.5, img: 'snack_cat.png' },
            { cat: 'Snack', name: 'Fudge Brownie', price: 2.5, img: 'snack_cat.png' },

            { cat: 'Rice', name: 'Shrimp Fried Rice', price: 4.5, img: 'rice_cat.png' },
            { cat: 'Rice', name: 'Golden Steam Rice', price: 1.0, img: 'rice_cat.png' },
            { cat: 'Rice', name: 'Garlic Rice', price: 1.5, img: 'rice_cat.png' },
            { cat: 'Rice', name: 'Pineapple Rice', price: 5.0, img: 'rice_cat.png' },
            { cat: 'Rice', name: 'Holy Basil Rice', price: 4.0, img: 'rice_cat.png' },

            { cat: 'Dessert', name: 'New York Cheesecake', price: 3.5, img: 'dessert_cat.png' },
            { cat: 'Dessert', name: 'Tiramisu Cup', price: 4.0, img: 'dessert_cat.png' },
            { cat: 'Dessert', name: 'Mango Sticky Rice', price: 3.5, img: 'dessert_cat.png' },
            { cat: 'Dessert', name: 'Premium Ice Cream', price: 2.5, img: 'dessert_cat.png' },
            { cat: 'Dessert', name: 'Delicate Fruit Tart', price: 3.0, img: 'dessert_cat.png' }
        ];

        for (const p of productData) {
            const catId = catMap[p.cat];
            if (!catId) {
                console.log(`Skipping ${p.name} - Category ${p.cat} not found.`);
                continue;
            }

            // Check if product exists already
            const [rows] = await connection.execute("SELECT id FROM products WHERE name = ? AND business_id = ?", [p.name, bizId]);
            if (rows.length > 0) {
                console.log(`Product ${p.name} already exists. Skipping.`);
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
            console.log(`Added product: ${p.name} ($${p.price})`);
        }

    } catch (error) {
        console.error("Error adding products:", error.message);
    } finally {
        await connection.end();
    }
}

addProducts();
