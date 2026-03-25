const authMiddleware = require("../middleware/auth.middleware");
const {
    create,
    getList,
    getDetails,
    receive,
    remove
} = require("../controller/purchase.controller");

module.exports = (app) => {
    app.get("/api/purchase", authMiddleware(), getList);
    app.get("/api/purchase-details", authMiddleware(), getDetails);
    app.post("/api/purchase", authMiddleware(), create);
    app.post("/api/purchase-receive", authMiddleware(), receive);
    app.delete("/api/purchase", authMiddleware(), remove);
};
