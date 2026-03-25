require('dotenv').config();
const mysql = require("mysql2/promise");

async function syncPermissions() {
    const isRailway = process.argv.includes('--railway');

    let connection;
    try {
        if (isRailway) {
            console.log("Connecting to Railway Database...");
            const connectionString = "mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway";
            connection = await mysql.createConnection(connectionString);
        } else {
            console.log("Connecting to Local Database...");
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_DATABASE || 'coffee_saas',
                port: process.env.DB_PORT || 3306
            });
        }

        console.log(`Starting Permission Sync on ${isRailway ? 'Railway' : 'Local'}...`);

        // 1. Ensure System Settings exists
        const [settingsCheck] = await connection.execute(
            "SELECT id FROM permissions WHERE route_key = '/settings' OR name = 'System Settings'"
        );
        if (settingsCheck.length === 0) {
            console.log("Adding missing permission: System Settings");
            await connection.execute(
                "INSERT INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
                ["System Settings", "/settings", 1]
            );
        } else {
            console.log("Updating System Settings permission...");
            await connection.execute(
                "UPDATE permissions SET name = 'System Settings', route_key = '/settings' WHERE id = ?",
                [settingsCheck[0].id]
            );
        }

        // 2. Ensure Dashboard route is consistent
        console.log("Syncing Dashboard route to '/dashboard' for consistency...");
        await connection.execute(
            "UPDATE permissions SET route_key = '/dashboard' WHERE name = 'Dashboard'"
        );

        // 3. Grant ALL permissions to all roles named 'Owner' or 'Super Admin'
        console.log("Granting all permissions to Owner and Super Admin roles...");
        const [roles] = await connection.execute(
            "SELECT id FROM roles WHERE name IN ('Owner', 'Super Admin') OR code IN ('owner', 'super_admin')"
        );

        const [allPerms] = await connection.execute("SELECT id FROM permissions");
        const permIds = allPerms.map(p => p.id);

        for (const role of roles) {
            console.log(`Syncing role ID: ${role.id}`);
            for (const pId of permIds) {
                try {
                    await connection.execute(
                        "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
                        [role.id, pId]
                    );
                } catch (err) { }
            }
        }

        console.log("Permission Sync completed successfully!");
    } catch (error) {
        console.error("Sync failed:", error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

syncPermissions();
