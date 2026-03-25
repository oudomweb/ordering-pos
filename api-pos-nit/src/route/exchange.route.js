const authMiddleware = require("../middleware/auth.middleware");
const exchange = require("../controller/exchange.controller");

module.exports = (app) => {
    app.get("/api/exchange_rate", authMiddleware(), exchange.getExchangeRate);
    app.get("/api/balance_data", authMiddleware(), exchange.getBalanceData);
    app.get("/api/transactions", authMiddleware(), exchange.getTransactions);
};
