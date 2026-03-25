const controller = require("../controller/shift.controller");
const authMiddleware = require("../middleware/auth.middleware");


module.exports = (app) => {
    app.post("/api/shift", authMiddleware(), controller.create); // Used for close
    app.post("/api/shift/open", authMiddleware(), controller.openShift);
    app.get("/api/shift/current", authMiddleware(), controller.getCurrentShift);
    app.get("/api/shift", authMiddleware(), controller.getList);
};
