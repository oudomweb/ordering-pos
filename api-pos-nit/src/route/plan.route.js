const authMiddleware = require("../middleware/auth.middleware");
const { getAllPlans, updatePlan, getBusinessPlan, getSystemSubscriptions, selfUpgrade, getBillingHistory } = require("../controller/plan.controller");

module.exports = (app) => {
    app.get("/api/plans", authMiddleware(), getAllPlans);
    app.get("/api/my-plan", authMiddleware(), getBusinessPlan);
    app.get("/api/my-plan/billing-history", authMiddleware("my-plan"), getBillingHistory);
    app.get("/api/system-subscriptions", authMiddleware(), getSystemSubscriptions);
    app.put("/api/plans", authMiddleware(), updatePlan);
    app.post("/api/my-plan/upgrade", authMiddleware("my-plan"), selfUpgrade);
};
