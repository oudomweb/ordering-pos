const { db, logError } = require("../util/helper");

// 1. Get all available system permissions (filtered by plan)
exports.getAllPermissions = async (req, res) => {
    try {
        const { business_id } = req;
        // System Admin sees all
        let sql = "SELECT id, name, route_key, min_plan_id FROM permissions";
        let params = [];

        if (business_id !== 1) {
            // A non-system-admin can only delegate permissions THEY currently possess
            sql += " WHERE id IN (SELECT permission_id FROM role_permissions WHERE role_id = ?)";
            params.push(req.role_id);
        }

        sql += " ORDER BY name ASC";

        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("permission.getAllPermissions", error, res);
    }
};

// 2. Get permissions specifically for a role
exports.getRolePermissions = async (req, res) => {
    try {
        const { role_id } = req.params;
        const [list] = await db.query(
            "SELECT permission_id FROM role_permissions WHERE role_id = ?",
            [role_id]
        );
        res.json({ list: list.map(item => item.permission_id) });
    } catch (error) {
        logError("permission.getRolePermissions", error, res);
    }
};

// 3. Update permissions for a role
exports.updateRolePermissions = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { role_id, permission_ids } = req.body; // permission_ids = [1, 2, 3...]
        const { business_id, role_id: my_role_id } = req;
        console.log(`Updating permissions for role ${role_id}:`, permission_ids);

        let final_permission_ids = [];
        if (permission_ids && Array.isArray(permission_ids)) {
            final_permission_ids = permission_ids.map(Number);
        }

        // Enforce strict hierarchy: non-system-admins can only grant permissions they themselves possess.
        if (business_id !== 1 && final_permission_ids.length > 0) {
            const [myPerms] = await conn.query(
                "SELECT permission_id FROM role_permissions WHERE role_id = ?",
                [my_role_id]
            );
            const myPermIds = myPerms.map(p => p.permission_id);
            // Filter out any requested permissions that the current user does not have
            final_permission_ids = final_permission_ids.filter(id => myPermIds.includes(id));
        }

        // Clear existing permissions. 
        // Note: For strictness, if a role had an escalated permission that the current user DOES NOT have,
        // we can either leave it untouched or wipe it. Wiping it is safer to prevent broken states, 
        // but preserving it might be better? Actually, the simplest strict approach:
        // By deleting all, if the user shouldn't have it, it's purged. If the role had it, it's purged.
        await conn.query("DELETE FROM role_permissions WHERE role_id = ?", [role_id]);

        // Insert new ones
        if (final_permission_ids.length > 0) {
            const values = final_permission_ids.map(p_id => [role_id, p_id]);
            // Bulk insert: mysql2 expects [ [ [v1,v2], [v1,v2] ] ]
            await conn.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
                [values]
            );
        }

        await conn.commit();
        res.json({ success: true, message: "Permissions updated successfully!" });
    } catch (error) {
        await conn.rollback();
        logError("permission.updateRolePermissions", error, res);
    } finally {
        conn.release();
    }
};
