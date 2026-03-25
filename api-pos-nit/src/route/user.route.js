const authMiddleware = require("../middleware/auth.middleware");
const user = require("../controller/user.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    // Standard CRUD
    app.get("/api/user", authMiddleware(), user.getList);
    app.post("/api/user", authMiddleware(), uploadFile.single("upload_image"), user.register);
    app.put("/api/user", authMiddleware(), uploadFile.single("upload_image"), user.register);
    app.delete("/api/user", authMiddleware(), user.remove);

    // Compat aliases
    app.get("/api/auth/get-user-list", authMiddleware(), user.getList);
};
