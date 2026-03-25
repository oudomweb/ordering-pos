const authMiddleware = require("../middleware/auth.middleware");
const permission = require("../controller/permission.controller");

module.exports = (app) => {
    app.get("/api/permission", authMiddleware(), permission.getAllPermissions);
    app.get("/api/permission/:role_id", authMiddleware(), permission.getRolePermissions);
    app.post("/api/permission/assign", authMiddleware(), permission.updateRolePermissions);
};
