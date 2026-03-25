const mysql = require('mysql2/promise');

async function updatePermissions() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'coffee_saas'
    });

    try {
        console.log("Adding Subscription Plans permission...");

        // 1. Add to permissions table
        const [res] = await db.query(
            "INSERT IGNORE INTO permissions (name, route_key) VALUES (?, ?)",
            ["Subscription Plans", "/plans"]
        );

        let permId = 0;
        if (res.insertId) {
            permId = res.insertId;
        } else {
            const [rows] = await db.query("SELECT id FROM permissions WHERE route_key = '/plans'");
            permId = rows[0].id;
        }

        // 2. Grant to Super Admin Role (typically ID 1)
        await db.query(
            "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
            [1, permId]
        );

        console.log("Permission added and granted to Super Admin!");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await db.end();
    }
}

updatePermissions();
