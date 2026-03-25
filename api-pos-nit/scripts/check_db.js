const { db } = require("../src/util/helper");

async function check() {
    try {
        const [rows] = await db.query("DESCRIBE businesses");
        console.log("Columns in 'businesses' table:");
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
    } catch (error) {
        console.error("Error describing table:", error.message);
    } finally {
        process.exit();
    }
}

check();
