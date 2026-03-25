const mysql = require('mysql2/promise');

async function migrate() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'coffee_saas'
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log("Checking /my-plan permission...");

        // Use regular route_key
        const [check] = await connection.query("SELECT id FROM permissions WHERE route_key = '/my-plan'");
        let permId;
        if (check.length === 0) {
            const [result] = await connection.query("INSERT INTO permissions (name, route_key) VALUES ('My Subscription', '/my-plan')");
            console.log("Permission added.");
            permId = result.insertId;
        } else {
            console.log("Permission already exists.");
            permId = check[0].id;
        }

        // Add to Super Admin (Assuming role_id = 1)
        console.log("Granting to Super Admin...");
        const [permCheck] = await connection.query("SELECT * FROM role_permissions WHERE role_id = 1 AND permission_id = ?", [permId]);
        if (permCheck.length === 0) {
            await connection.query("INSERT INTO role_permissions (role_id, permission_id) VALUES (1, ?)", [permId]);
            console.log("Granted to Super Admin.");
        }

        await connection.end();
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
