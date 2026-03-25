const { db } = require("./src/util/helper");

async function addPermission() {
    try {
        // 1. Insert Permission
        const [permRes] = await db.query(
            "INSERT IGNORE INTO permissions (name, route_key, min_plan_id) VALUES (?, ?, ?)",
            ['Table Management', '/table', 1]
        );

        let permId = permRes.insertId;
        if (permId === 0) {
            const [existing] = await db.query("SELECT id FROM permissions WHERE route_key = '/table'");
            permId = existing[0]?.id;
        }

        if (permId) {
            console.log("Permission ID:", permId);
            // 2. Assign to Business Owner Role (Assuming role_id 2 or whatever role the user has)
            // Let's just assign it to all current roles for now to make it easy for testing
            const [roles] = await db.query("SELECT id FROM roles");
            for (const role of roles) {
                await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [role.id, permId]);
            }
            console.log("Assigned to all roles successfully!");
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

addPermission();
