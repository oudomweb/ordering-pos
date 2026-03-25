const authMiddleware = require("../middleware/auth.middleware");
const { uploadFile } = require("../util/helper");
const {
    getList,
    create,
    update,
    remove
} = require("../controller/branch.controller");

module.exports = (app) => {
    app.get("/api/branch", authMiddleware(), getList);
    app.post("/api/branch", authMiddleware(), uploadFile.single("khqr_image"), create);
    app.put("/api/branch", authMiddleware(), uploadFile.single("khqr_image"), update);
    app.delete("/api/branch", authMiddleware(), remove);
};
