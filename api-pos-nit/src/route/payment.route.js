const authMiddleware = require("../middleware/auth.middleware");
const {
    createPayment,
    paymentCallback,
    checkPaymentStatus,
    simulateSuccess,
} = require("../controller/payment.controller");
const { generateInvoice } = require("../controller/invoice.controller");

module.exports = (app) => {
    // Create a payment session (user initiates upgrade)
    app.post("/api/payment/create", authMiddleware("my-plan"), createPayment);

    // PayWay webhook — no auth (called by PayWay server)
    app.post("/api/payment/callback", paymentCallback);

    // Frontend polls this to know if payment succeeded
    app.get("/api/payment/status/:tran_id", authMiddleware("my-plan"), checkPaymentStatus);

    // DEV ONLY: simulate a successful payment (no real PayWay needed)
    app.post("/api/payment/simulate-success", authMiddleware("my-plan"), simulateSuccess);

    // PDF Invoice Download
    app.get("/api/payment/invoice/:tran_id", authMiddleware("my-plan"), generateInvoice);
};
