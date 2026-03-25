const authMiddleware = require("../middleware/auth.middleware");
const { getList } = require("../controller/dashboard.controller");

module.exports = (app) => {
  app.get("/api/dashboard", authMiddleware(), getList);
};
