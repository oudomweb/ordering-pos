const mysql = require("mysql2/promise");

async function migrateRailway() {
    console.log("Connecting to Railway Database...");
    // Connection string from user's railway-specific scripts
    const connectionString = "mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway";

    const connection = await mysql.createConnection(connectionString);
    try {
        console.log("Starting migration on Railway: Adding missing columns to 'businesses' table...");

        const columns = [
            { name: "address", type: "TEXT" },
            { name: "website", type: "VARCHAR(255)" },
            { name: "tax_percent", type: "DECIMAL(10, 2) DEFAULT 0" },
            { name: "service_charge", type: "DECIMAL(10, 2) DEFAULT 0" },
            { name: "kh_exchange_rate", type: "INT DEFAULT 4000" },
            { name: "currency_symbol", type: "VARCHAR(10) DEFAULT '$'" },
            { name: "telegram_link", type: "VARCHAR(255)" },
            { name: "facebook_link", type: "VARCHAR(255)" }
        ];

        for (const col of columns) {
            try {
                // Check if column exists
                const [check] = await connection.execute(
                    `SELECT COUNT(*) AS count 
                     FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_NAME = 'businesses' AND COLUMN_NAME = ?`,
                    [col.name]
                );

                if (check[0].count === 0) {
                    console.log(`Adding column: ${col.name}`);
                    await connection.execute(`ALTER TABLE businesses ADD COLUMN ${col.name} ${col.type}`);
                } else {
                    console.log(`Column already exists: ${col.name}`);
                }
            } catch (colErr) {
                console.error(`Error processing column ${col.name}:`, colErr.message);
            }
        }

        console.log("Railway Migration completed successfully!");
    } catch (error) {
        console.error("Railway Migration failed:", error);
    } finally {
        await connection.end();
        process.exit();
    }
}

migrateRailway();
