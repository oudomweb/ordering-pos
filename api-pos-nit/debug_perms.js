const { db } = require('./src/util/helper');

async function debug() {
    try {
        const email = 'senlin@gmail.com';
        console.log(`Checking permissions for: ${email}`);

        const [users] = await db.query(`
            SELECT u.id, u.role_id, u.business_id, r.name as role_name, r.code as role_code, b.plan_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN businesses b ON u.business_id = b.id
            WHERE u.email = ?
        `, [email]);

        if (users.length === 0) {
            console.log("User not found");
            return;
        }

        const user = users[0];
        console.log("User Info:", user);

        const [perms] = await db.query(`
            SELECT p.id, p.name, p.route_key, p.min_plan_id
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        `, [user.role_id]);

        console.log(`Found ${perms.length} permissions for this role:`);
        perms.forEach(p => {
            console.log(` - ${p.name} (${p.route_key}) [Min Plan: ${p.min_plan_id}]`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

debug();
