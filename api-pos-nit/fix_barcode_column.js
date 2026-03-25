const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixBarcode() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: process.env.DB_PORT
    });

    try {
        console.log("Checking for barcode column in products table...");
        const [columns] = await connection.query("SHOW COLUMNS FROM products LIKE 'barcode'");

        if (columns.length === 0) {
            console.log("Adding barcode column to products table...");
            await connection.query("ALTER TABLE products ADD COLUMN barcode VARCHAR(50) AFTER category_id");
            console.log("Column added successfully!");
        } else {
            console.log("Barcode column already exists.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

fixBarcode();
