
const mysql = require("mysql2/promise");

async function addCategories() {
    const connection = await mysql.createConnection("mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway");
    try {
        const bizId = 5; // Based on previous session knowledge for this user's business
        const categories = [
            ['Juice', null],
            ['Milk', null],
            ['Snack', null],
            ['Rice', null],
            ['Dessert', null]
        ];

        for (const [name, image] of categories) {
            // Check if exists first for idempotency
            const [rows] = await connection.execute(
                "SELECT id FROM categories WHERE name = ? AND business_id = ?",
                [name, bizId]
            );

            if (rows.length === 0) {
                await connection.execute(
                    "INSERT INTO categories (business_id, name, image) VALUES (?, ?, ?)",
                    [bizId, name, image]
                );
                console.log(`Added category: ${name}`);
            } else {
                console.log(`Category ${name} already exists.`);
            }
        }
    } catch (error) {
        console.error("Error adding categories:", error);
    } finally {
        await connection.end();
    }
}

addCategories();
