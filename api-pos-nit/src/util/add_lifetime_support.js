const { db } = require('./helper');

async function main() {
  try {
    // 1. Add billing_cycle to subscription_plans
    await db.query(`
      ALTER TABLE subscription_plans 
      ADD COLUMN billing_cycle ENUM('monthly', 'lifetime') DEFAULT 'monthly' AFTER price
    `);
    console.log("Column 'billing_cycle' added to subscription_plans.");

    // 2. Allow NULL for end_date in subscriptions
    await db.query(`
      ALTER TABLE subscriptions 
      MODIFY COLUMN end_date DATE NULL
    `);
    console.log("subscriptions.end_date is now NULLABLE.");

  } catch (err) {
    console.error("Migration Failed:", err.message);
  } finally {
    process.exit();
  }
}

main();
