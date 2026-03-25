const { db } = require("./src/util/helper");

async function checkCols() {
    try {
        const [rows] = await db.query("DESCRIBE orders");
        console.log("Orders Table Structure:");
        console.table(rows);

        // Also try to fix it right away if it's NOT NULL
        console.log("Attempting to allow NULL for user_id...");
        await db.query("ALTER TABLE orders MODIFY user_id INT NULL");
        console.log("Success! user_id now allows NULL.");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkCols();
