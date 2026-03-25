const pool = require("./src/util/connection");

async function check() {
    try {
        const [rows] = await pool.query("SHOW FULL COLUMNS FROM products");
        console.log("Products columns:");
        rows.forEach(row => console.log(`- ${row.Field}: ${row.Type}, Null: ${row.Null}, Default: ${row.Default}, Key: ${row.Key}`));

        const [rows2] = await pool.query("SHOW FULL COLUMNS FROM branch_products");
        console.log("\nBranch Products columns:");
        rows2.forEach(row => console.log(`- ${row.Field}: ${row.Type}, Null: ${row.Null}, Default: ${row.Default}, Key: ${row.Key}`));

        try {
            const [rows3] = await pool.query("DESCRIBE subscription_plans");
            console.log("\nSubscription Plans columns:");
            rows3.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
        } catch (e) {
            console.log("\nSubscription Plans table missing or error:", e.message);
        }

        try {
            const [rows4] = await pool.query("DESCRIBE businesses");
            console.log("\nBusinesses columns:");
            rows4.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
        } catch (e) {
            console.log("\nBusinesses table missing or error:", e.message);
        }

        try {
            const [rows5] = await pool.query("DESCRIBE order_details");
            console.log("\nOrder Details columns:");
            rows5.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
        } catch (e) {
            console.log("\nOrder Details table missing or error:", e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

check();
