const authMiddleware = require("../middleware/auth.middleware");
const { getSettings, updateSettings } = require("../controller/settings.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
    app.get("/api/settings", authMiddleware(), getSettings);
    app.put("/api/settings", authMiddleware(), uploadFile.single("upload_logo"), updateSettings);

    // System Master Settings (for platform owner)
    const sysCtrl = require("../controller/system_settings.controller");
    app.get("/api/system-settings", authMiddleware(), sysCtrl.getSystemSettings);
    app.put("/api/system-settings", authMiddleware(), uploadFile.single("khqr_image"), sysCtrl.updateSystemSettings);
};
