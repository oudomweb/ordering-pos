const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Adding tran_id to subscriptions table...");
        await db.query("ALTER TABLE subscriptions ADD COLUMN tran_id VARCHAR(100) DEFAULT NULL AFTER status");
        console.log("Success! tran_id column added.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exit(1);
    }
}

migrate();
