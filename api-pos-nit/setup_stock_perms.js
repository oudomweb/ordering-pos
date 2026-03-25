const { db } = require('./src/util/helper');

async function setup() {
    try {
        console.log("Setting up stock permissions...");

        // 1. Ensure permissions exist
        await db.query("INSERT IGNORE INTO permissions (name, route_key) VALUES (?, ?)",
            ['Stock View', '/stock']);
        await db.query("INSERT IGNORE INTO permissions (name, route_key) VALUES (?, ?)",
            ['Stock Adjust', 'stock/adjust']);

        // 2. Get IDs
        const [[p1]] = await db.query("SELECT id FROM permissions WHERE route_key = '/stock'");
        const [[p2]] = await db.query("SELECT id FROM permissions WHERE route_key = 'stock/adjust'");

        // 3. Link to Business 2's Super Admin role (Main Branch senlin@gmail.com)
        const [roles] = await db.query("SELECT id FROM roles WHERE business_id = 2 AND code = 'super_admin'");
        if (roles.length > 0) {
            const role_id = roles[0].id;
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role_id, p1.id]);
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role_id, p2.id]);
            console.log("Found B2 Super Admin: linking stock perms.");
        }

        // 4. Link to Business 1 (System Admin) as well
        const [roles1] = await db.query("SELECT id FROM roles WHERE business_id = 1 AND code = 'super_admin'");
        if (roles1.length > 0) {
            const rid = roles1[0].id;
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [rid, p1.id]);
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [rid, p2.id]);
        }

        console.log("Setup complete!");
        process.exit(0);
    } catch (e) {
        console.error("Setup failed:", e);
        process.exit(1);
    }
}

setup();
