const { db } = require('./src/util/helper');

async function fix() {
    try {
        console.log("Fixing stock permissions for Business 2...");

        // 1. Get Permission IDs
        const [pRows] = await db.query("SELECT id, name FROM permissions WHERE route_key IN ('/stock', 'stock/adjust')");
        if (pRows.length === 0) {
            console.log("Permissions not found in DB. Re-creating...");
            await db.query("INSERT IGNORE INTO permissions (name, route_key) VALUES (?, ?)", ['Stock View', '/stock']);
            await db.query("INSERT IGNORE INTO permissions (name, route_key) VALUES (?, ?)", ['Stock Adjust', 'stock/adjust']);
        }

        const [[p1]] = await db.query("SELECT id FROM permissions WHERE route_key = '/stock'");
        const [[p2]] = await db.query("SELECT id FROM permissions WHERE route_key = 'stock/adjust'");

        // 2. Link to ALL roles of Business 2 that represent Owner or Admin
        const [roles] = await db.query("SELECT id, name, code FROM roles WHERE business_id = 2");
        for (const role of roles) {
            console.log(`Linking to role: ${role.name} (${role.code})`);
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, p1.id]);
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, p2.id]);
        }

        // 3. Link to ALL roles of Business 1 (System Admin) as well
        const [roles1] = await db.query("SELECT id, name, code FROM roles WHERE business_id = 1");
        for (const role of roles1) {
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, p1.id]);
            await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, p2.id]);
        }

        console.log("Permissions fix complete!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
