const {
  register,
  login,
  getProfile,
  updateProfile
} = require("../controller/auth.controller");
const { guestAccess } = require("../controller/guest.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  // Public Routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/guest-access", guestAccess);

  // Protected Routes
  app.get("/api/auth/profile", authMiddleware(), getProfile);
  app.put("/api/auth/profile", authMiddleware(), uploadFile.single("upload_image"), updateProfile);
};

