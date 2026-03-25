const authMiddleware = require("../middleware/auth.middleware");
const {
    getExpenseTypes,
    getList,
    create,
    update,
    remove,
} = require("../controller/expense.controller");

module.exports = (app) => {
    app.get("/api/expense-type", authMiddleware(), getExpenseTypes);
    app.get("/api/expense", authMiddleware(), getList);
    app.post("/api/expense", authMiddleware(), create);
    app.put("/api/expense", authMiddleware(), update);
    app.delete("/api/expense", authMiddleware(), remove);
};
