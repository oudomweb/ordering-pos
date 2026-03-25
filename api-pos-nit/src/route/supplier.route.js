const authMiddleware = require("../middleware/auth.middleware");
const { getList, create, update, remove } = require("../controller/supplier.controller");

module.exports = (app) => {
  app.get("/api/supplier", authMiddleware(), getList);
  app.post("/api/supplier", authMiddleware(), create);
  app.put("/api/supplier", authMiddleware(), update);
  app.delete("/api/supplier", authMiddleware(), remove);
};
