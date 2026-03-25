const authMiddleware = require("../middleware/auth.middleware");
const { getLogs, adjustStock } = require("../controller/stock.controller");

module.exports = (app) => {
    app.get("/api/stock/logs", authMiddleware(), getLogs);
    app.post("/api/stock/adjust", authMiddleware(), adjustStock);
};
