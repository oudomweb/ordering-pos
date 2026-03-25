const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Creating stock_logs table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_logs (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                business_id     INT NOT NULL,
                branch_id       INT NOT NULL,
                item_type       ENUM('product', 'raw_material') NOT NULL,
                item_id         INT NOT NULL,
                old_qty         DECIMAL(10,2) NOT NULL,
                new_qty         DECIMAL(10,2) NOT NULL,
                qty_changed     DECIMAL(10,2) NOT NULL,
                type            ENUM('sale', 'purchase', 'adjustment', 'waste', 'return') NOT NULL,
                ref_id          VARCHAR(50) DEFAULT NULL, -- Transaction ID (PO-xxx, INV-xxx)
                reason          TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by      INT,
                FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
            )
        `);

        // Add index for performance
        await db.query("CREATE INDEX idx_item_logs ON stock_logs(business_id, item_type, item_id)");

        console.log("Success! stock_logs table created.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
