const authMiddleware = require("../middleware/auth.middleware");
const {
  getList,
  create,
  update,
  remove
} = require("../controller/category.controller");

module.exports = (app) => {
  app.get("/api/category", authMiddleware("category"), getList);
  app.post("/api/category", authMiddleware("category"), create);
  app.put("/api/category", authMiddleware("category"), update);
  app.delete("/api/category", authMiddleware("category"), remove);
};