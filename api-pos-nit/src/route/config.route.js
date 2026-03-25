const authMiddleware = require("../middleware/auth.middleware");
const { getList, getProductConfig } = require("../controller/config.controller");
module.exports = (app) => {
  app.get("/api/config", authMiddleware(), getList);
  app.get("/api/config/product/:product_id", authMiddleware(), getProductConfig);
};
