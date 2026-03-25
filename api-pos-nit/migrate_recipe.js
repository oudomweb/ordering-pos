const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Creating recipe_detail table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS recipe_detail (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                product_id      INT NOT NULL,
                raw_material_id INT NOT NULL,
                qty             DECIMAL(10,3) NOT NULL, -- 0.020 for 20g
                unit            VARCHAR(20),
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (raw_material_id) REFERENCES raw_material(id) ON DELETE CASCADE
            )
        `);

        console.log("Success! recipe_detail table created.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
