const authMiddleware = require("../middleware/auth.middleware");
const { getList, toggle } = require("../controller/favorite.controller");

module.exports = (app) => {
    app.get("/api/favorite", authMiddleware(), getList);
    app.post("/api/favorite", authMiddleware(), toggle);
};
