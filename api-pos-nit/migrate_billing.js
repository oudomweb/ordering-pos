const mysql = require('mysql2/promise');

async function migrateBillingHistory() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'coffee_saas'
    });

    try {
        console.log("Starting Billing History Migration...");

        // 1. Ensure subscriptions table has plan_id column
        const [cols] = await db.query("SHOW COLUMNS FROM subscriptions LIKE 'plan_id'");
        if (cols.length === 0) {
            console.log("Adding plan_id column to subscriptions...");
            await db.query("ALTER TABLE subscriptions ADD COLUMN plan_id INT DEFAULT 1 AFTER business_id");
            // Update existing records based on plan_type
            await db.query("UPDATE subscriptions SET plan_id = 1 WHERE plan_type = 'free' OR plan_type IS NULL");
            await db.query("UPDATE subscriptions SET plan_id = 2 WHERE plan_type = 'pro'");
            console.log("plan_id column added and populated.");
        } else {
            console.log("plan_id column already exists. Skipping.");
        }

        // 2. Ensure subscriptions table has created_at column
        const [cols2] = await db.query("SHOW COLUMNS FROM subscriptions LIKE 'created_at'");
        if (cols2.length === 0) {
            console.log("Adding created_at column to subscriptions...");
            await db.query("ALTER TABLE subscriptions ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            console.log("created_at column added.");
        } else {
            console.log("created_at column already exists. Skipping.");
        }

        console.log("✅ Billing History Migration Successful!");
    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        await db.end();
    }
}

migrateBillingHistory();
