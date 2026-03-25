const authMiddleware = require("../middleware/auth.middleware");
const report = require("../controller/report.controller");

module.exports = (app) => {
  app.get("/api/report_Sale_Sammary", authMiddleware(), report.report_Sale_Summary);
  app.get("/api/report_Expense_Summary", authMiddleware(), report.report_Expense_Summary);
  app.get("/api/report_Customer", authMiddleware(), report.report_Customer);
  app.get("/api/report_Purchase_Summary", authMiddleware(), report.report_Purchase_Summary);
  app.get("/api/top_sales", authMiddleware(), report.top_sale);
};