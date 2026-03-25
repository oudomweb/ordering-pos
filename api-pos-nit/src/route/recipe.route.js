const authMiddleware = require("../middleware/auth.middleware");
const { getRecipe, saveRecipe, removeRecipe } = require("../controller/recipe.controller");

module.exports = (app) => {
    app.get("/api/recipe", authMiddleware(), getRecipe);
    app.post("/api/recipe", authMiddleware(), saveRecipe);
    app.delete("/api/recipe", authMiddleware(), removeRecipe);
};
