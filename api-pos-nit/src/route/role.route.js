const authMiddleware = require("../middleware/auth.middleware");
const { getList, create, update, remove } = require("../controller/role.controller");

module.exports = (app) => {
  app.get("/api/role", authMiddleware(), getList);
  app.post("/api/role", authMiddleware(), create);
  app.put("/api/role", authMiddleware(), update);
  app.delete("/api/role", authMiddleware(), remove);
};
