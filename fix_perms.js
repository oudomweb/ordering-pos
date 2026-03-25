const mysql = require('mysql2/promise');
const config = require('./api-pos-nit/src/util/config');

async function run() {
    const db = await mysql.createConnection(config.db);

    // Set system-exclusive permissions to a high min_plan_id so they are never assigned automatically
    // The relevant routes: /plans and /business
    await db.query("UPDATE permissions SET min_plan_id = 999 WHERE route_key IN ('/plans', '/business')");

    // Remove these system-exclusive permissions from any existing non-admin roles
    await db.query(`
        DELETE rp 
        FROM role_permissions rp 
        JOIN permissions p ON rp.permission_id = p.id 
        JOIN roles r ON rp.role_id = r.id 
        WHERE r.business_id != 1 AND p.route_key IN ('/plans', '/business')
    `);

    console.log('System exclusive permissions successfully adjusted and cleaned.');
    process.exit(0);
}

run().catch(console.error);
