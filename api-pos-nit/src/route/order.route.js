const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    getOrderDetail,
    getPendingOrders,
    updateStatus
} = require("../controller/order.controller");

module.exports = (app) => {
    app.get("/api/order", authMiddleware("order"), getList);
    app.get("/api/order-pending", authMiddleware("order"), getPendingOrders);
    app.get("/api/order/:order_id", authMiddleware("order"), getOrderDetail);
    app.post("/api/order", authMiddleware("order"), create);
    app.post("/api/order/create", authMiddleware("order"), create); // Alias for convenience
    app.put("/api/order-status", authMiddleware("order"), updateStatus);
};
