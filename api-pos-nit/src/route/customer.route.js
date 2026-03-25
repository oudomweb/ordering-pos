const authMiddleware = require("../middleware/auth.middleware");
const {
  getList,
  create,
  update,
  remove
} = require("../controller/customer.controller");

module.exports = (app) => {
  app.get("/api/customer", authMiddleware(), getList);
  app.post("/api/customer", authMiddleware(), create);
  app.put("/api/customer", authMiddleware(), update);
  app.delete("/api/customer", authMiddleware(), remove);
};
