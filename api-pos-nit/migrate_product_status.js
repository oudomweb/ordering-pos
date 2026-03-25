const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Adding status column to products table...");
        await db.query("ALTER TABLE products ADD COLUMN status TINYINT(1) DEFAULT 1 AFTER image");
        console.log("Success! status column added.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
