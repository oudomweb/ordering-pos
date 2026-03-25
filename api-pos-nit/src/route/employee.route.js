const authMiddleware = require("../middleware/auth.middleware");
const {
  getList,
  create,
  update,
  remove,
} = require("../controller/employee.controller");

module.exports = (app) => {
  app.get("/api/employee", authMiddleware(), getList);
  app.post("/api/employee", authMiddleware(), create);
  app.put("/api/employee", authMiddleware(), update);
  app.delete("/api/employee", authMiddleware(), remove);
};
