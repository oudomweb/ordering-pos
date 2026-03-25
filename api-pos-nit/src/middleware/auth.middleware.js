const jwt = require("jsonwebtoken");
const config = require("../util/config");

// This middleware will protect routes and inject business context
const authMiddleware = (permission_name) => {
    // Helper to check if decoded token contains required permission
    const hasPermission = (decoded, permission) => {
        if (!decoded || !Array.isArray(decoded.permissions)) return false;
        // Clean the input permission (remove leading /)
        const target = permission.replace(/^\/+/, '');
        return decoded.permissions.includes(target);
    };

    return async (req, res, next) => {
        const authorization = req.headers.authorization;
        let token = null;

        if (authorization && authorization.startsWith("Bearer ")) {
            token = authorization.slice(7);
        }

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized - No token provided",
                error: "TOKEN_MISSING"
            });
        }

        try {
            const decoded = jwt.verify(token, config.token.access_token_key);
            const { db } = require("../util/helper"); // Dynamic require to avoid circularity

            // Inject SaaS context into request
            req.user_id = decoded.user_id;
            req.business_id = Number(decoded.business_id);
            req.branch_id = Number(decoded.branch_id);
            req.role_id = Number(decoded.role_id);
            req.auth = decoded;

            // 🚀 LIVE DATABASE PROTECTION: Fetch current role permissions from DB
            const [rows] = await db.query(
                "SELECT p.route_key FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?",
                [req.role_id]
            );
            const livePerms = rows.map(r => r.route_key.toLowerCase().replace(/^\/+|\/+$/g, ''));

            // Notify UI if local permissions are stale
            const jwtPerms = Array.isArray(decoded.permissions) ? decoded.permissions : [];
            if (JSON.stringify(livePerms.sort()) !== JSON.stringify(jwtPerms.sort())) {
                res.set("Access-Control-Expose-Headers", "X-Permissions-Updated");
                res.set("X-Permissions-Updated", "true");
            }

            // 🚀 SaaS Administrator (Business 1) Restriction
            const shopLevelRoutes = ['product', 'category', 'table', 'invoices', 'order', 'inventory', 'stock', 'raw_material', 'purchase', 'expense', 'shift', 'payment', 'exchange'];
            if (req.business_id === 1 && permission_name && shopLevelRoutes.includes(permission_name.toLowerCase())) {
                return res.status(403).json({ message: "Security Violation: SaaS Administrator cannot perform shop-level operations.", error: "SYSTEM_RESTRICTION" });
            }

            // 🚀 STRICT RBAC GUARD: Check against live DB state
            if (permission_name) {
                const target = permission_name.toLowerCase().replace(/^\/+|\/+$/g, '');
                if (!livePerms.includes(target)) {
                    return res.status(403).json({ 
                        message: `Forbidden - Access revoked for ${permission_name}`, 
                        error: "INSUFFICIENT_PERMISSIONS" 
                    });
                }
            }

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Session expired", error: "TOKEN_EXPIRED" });
            }
            return res.status(401).json({ message: "Invalid identity token", error: "TOKEN_INVALID" });
        }
    };
};

module.exports = authMiddleware;
