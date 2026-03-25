const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create, 
    update,
    remove,
} = require("../controller/raw_material.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    app.get("/api/raw_material", authMiddleware(), getList);
    app.post("/api/raw_material", authMiddleware(), uploadFile.single("image"), create);
    app.put("/api/raw_material", authMiddleware(), uploadFile.single("image"), update);
    app.delete("/api/raw_material", authMiddleware(), remove);
};
