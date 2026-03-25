const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: 'localhost', user: 'root', password: '', database: 'coffee_saas'
    });

    // 1. Add /expense permission if not exists
    const [existing] = await db.query("SELECT id FROM permissions WHERE route_key = '/expense'");
    let expensePermId;
    if (existing.length === 0) {
        const [r] = await db.query("INSERT INTO permissions (name, route_key) VALUES (?, ?)", ['Expense', '/expense']);
        expensePermId = r.insertId;
        console.log('✅ Added /expense permission id=' + expensePermId);
    } else {
        expensePermId = existing[0].id;
        console.log('ℹ️  /expense permission already exists id=' + expensePermId);
    }

    // 2. Link to ALL roles in business 1
    const [roles] = await db.query("SELECT id FROM roles WHERE business_id = 1");
    for (const role of roles) {
        const [linkExists] = await db.query(
            "SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?",
            [role.id, expensePermId]
        );
        if (linkExists.length === 0) {
            await db.query("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, expensePermId]);
            console.log(`✅ Linked /expense to role_id=${role.id}`);
        }
    }

    // 3. Confirm total permissions for role 1
    const [totalPerms] = await db.query("SELECT COUNT(*) as cnt FROM role_permissions WHERE role_id = 1");
    console.log(`\nTotal permissions for Super Admin (role 1): ${totalPerms[0].cnt}`);

    await db.end();
    console.log('\n✅ Done!');
}
main().catch(console.error);
