const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'coffee_saas'
    });

    // 1. Add /permission permission if not exists
    const [existing] = await db.query("SELECT id FROM permissions WHERE route_key = '/permission'");
    let permId;
    if (existing.length === 0) {
        const [r] = await db.query("INSERT INTO permissions (name, route_key) VALUES (?, ?)", ['Role Permissions', '/permission']);
        permId = r.insertId;
        console.log('✅ Added /permission permission id=' + permId);
    } else {
        permId = existing[0].id;
        console.log('ℹ️  /permission permission already exists id=' + permId);
    }

    // 2. Link to role 1 (Super Admin)
    const [linkExists] = await db.query("SELECT 1 FROM role_permissions WHERE role_id = 1 AND permission_id = ?", [permId]);
    if (linkExists.length === 0) {
        await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [1, permId]);
        console.log(`✅ Linked /permission to role_id=1`);
    }

    await db.end();
}
main().catch(console.error);
