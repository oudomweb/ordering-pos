const authMiddleware = require("../middleware/auth.middleware");
const business = require("../controller/business.controller");

module.exports = (app) => {
    app.get("/api/business", authMiddleware(), business.getList);
    app.post("/api/business", authMiddleware(), business.create);
    app.put("/api/business/status", authMiddleware(), business.updateStatus);
    app.put("/api/business/plan", authMiddleware(), business.updatePlan);
};
