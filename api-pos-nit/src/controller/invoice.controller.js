const PDFDocument = require("pdfkit");
const { db, logError } = require("../util/helper");
const dayjs = require("dayjs");

/**
 * GET /api/payment/invoice/:tran_id
 * Generate a PDF invoice for a successful payment
 */
exports.generateInvoice = async (req, res) => {
    try {
        const { tran_id } = req.params;
        const { business_id } = req;

        // 1. Fetch payment and plan details
        const sql = `
            SELECT p.*, sp.name as plan_name, sp.price as plan_price,
                   b.name as business_name, b.owner_name, b.email as business_email
            FROM payments p
            JOIN subscription_plans sp ON p.plan_id = sp.id
            JOIN businesses b ON p.business_id = b.id
            WHERE p.tran_id = ? AND p.business_id = ?
        `;
        const [rows] = await db.query(sql, [tran_id, business_id]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Transaction not found." });
        }

        const data = rows[0];

        // 2. Setup PDF document
        const doc = new PDFDocument({ margin: 50, size: "A4" });

        // Pipe to response
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Invoice-${tran_id}.pdf`);
        doc.pipe(res);

        // ─── Header Section ───────────────────────────────────────────
        doc.fillColor("#1e4a2d").fontSize(24).text("BORCELLE COFFEE", 50, 50, { align: "left" });
        doc.fillColor("#666").fontSize(10).text("Premium POS Ecosystem", 50, 80);

        doc.fillColor("#333").fontSize(20).text("INVOICE", 400, 50, { align: "right" });
        doc.fontSize(10).text(`Tran ID: ${tran_id}`, 400, 80, { align: "right" });
        doc.text(`Date: ${dayjs(data.created_at).format("DD MMM YYYY")}`, 400, 95, { align: "right" });

        doc.moveDown(2);
        doc.strokeColor("#eee").lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();

        // ─── Billing Details ──────────────────────────────────────────
        doc.moveDown(1);
        doc.fillColor("#1e4a2d").fontSize(12).text("BILL TO:", 50, 140);
        doc.fillColor("#333").fontSize(14).text(data.business_name, 50, 160);
        doc.fontSize(10).text(`Attn: ${data.owner_name}`, 50, 180);
        doc.text(data.business_email, 50, 195);

        // Sub Info section (right)
        doc.fillColor("#1e4a2d").fontSize(12).text("STATUS:", 400, 140, { align: "right" });
        doc.fillColor("#2d6a3e").fontSize(16).text(data.status.toUpperCase(), 400, 160, { align: "right" });
        doc.fillColor("#333").fontSize(10).text(`Method: PayWay ABA`, 400, 185, { align: "right" });

        // ─── Table Section ────────────────────────────────────────────
        doc.moveDown(3);
        const tableTop = 250;

        // Table Header
        doc.fillColor("#f4f1eb").rect(50, tableTop, 500, 30).fill();
        doc.fillColor("#1e4a2d").fontSize(10).text("DESCRIPTION", 70, tableTop + 10);
        doc.text("DURATION", 300, tableTop + 10);
        doc.text("AMOUNT", 480, tableTop + 10, { align: "right" });

        // Table Rows
        doc.fillColor("#333").fontSize(11).text(`${data.plan_name} Subscription Plan`, 70, tableTop + 45);
        doc.fontSize(10).text(`${data.duration_days} Days`, 300, tableTop + 45);
        doc.fontSize(11).text(`$${parseFloat(data.amount).toFixed(2)}`, 480, tableTop + 45, { align: "right" });

        doc.strokeColor("#eee").lineWidth(1).moveTo(50, tableTop + 70).lineTo(550, tableTop + 70).stroke();

        // ─── Total Section ────────────────────────────────────────────
        const totalPos = tableTop + 100;
        doc.fillColor("#1e4a2d").fontSize(12).text("Total (USD):", 380, totalPos);
        doc.fontSize(22).text(`$${parseFloat(data.amount).toFixed(2)}`, 450, totalPos - 5, { align: "right" });

        // ─── Footer ───────────────────────────────────────────────────
        const footerPos = 750;
        doc.strokeColor("#eee").lineWidth(1).moveTo(50, footerPos - 20).lineTo(550, footerPos - 20).stroke();
        doc.fillColor("#999").fontSize(10).text("Thank you for your business! This is a system-generated invoice.", 50, footerPos, { align: "center", width: 500 });

        doc.end();

    } catch (error) {
        logError("invoice.generateInvoice", error, res);
    }
};
