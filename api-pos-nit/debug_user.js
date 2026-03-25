const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'coffee_saas'
    });
    const [roles] = await db.query("SELECT * FROM roles WHERE id=1");
    console.log("=== ROLE DETAILS ===");
    console.log(JSON.stringify(roles, null, 2));
    await db.end();
}
main().catch(console.error);
