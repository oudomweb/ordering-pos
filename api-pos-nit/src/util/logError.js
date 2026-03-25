const fs = require("fs/promises");
const path = require("path");
const util = require("util");

exports.logError = async (controller, error, res) => {
  // 1. Detailed console logging (visible in Railway/Production logs)
  console.error(`🚨 [${controller}] Error Detail:`, util.inspect(error, { depth: null, colors: true }));

  try {
    const logDir = "./logs";
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }

    const logPath = path.join(logDir, controller + ".txt");
    const logMessage = `[${new Date().toISOString()}] ${util.inspect(error, { depth: null })}\n`;
    await fs.appendFile(logPath, logMessage);
  } catch (logErr) {
    console.error("Critical: Failed to write to log file:", logErr);
  }

  // 2. Return friendly response to client
  if (res && !res.headersSent) {
    res.status(500).json({
      error: "Internal Server Error",
      message: error?.message || "Something went wrong! Please try again later.",
      sqlMessage: error?.sqlMessage || null,
      controller: controller
    });
  }
};
  