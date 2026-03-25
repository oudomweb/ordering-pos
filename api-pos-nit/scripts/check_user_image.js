const { db } = require("../src/util/helper");

async function check() {
    try {
        const [rows] = await db.query("SELECT id, name, email, image FROM users WHERE email = 'pongchiva@gmail.com'");
        console.log("User data:", JSON.stringify(rows[0], null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        process.exit();
    }
}

check();
