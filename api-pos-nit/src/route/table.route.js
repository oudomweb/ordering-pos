const authMiddleware = require("../middleware/auth.middleware");
const {
    getList,
    create,
    updateStatus,
    remove
} = require("../controller/table.controller");

module.exports = (app) => {
    app.get("/api/table", authMiddleware("table"), getList);
    app.post("/api/table", authMiddleware("table"), create);
    app.put("/api/table-status", authMiddleware("table"), updateStatus);
    app.delete("/api/table", authMiddleware("table"), remove);
};
