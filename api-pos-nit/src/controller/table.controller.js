const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const { branch_id } = req.query;
        const { business_id } = req;

        let sql = "SELECT * FROM branch_tables WHERE business_id = ?";
        let params = [business_id];

        if (branch_id) {
            sql += " AND branch_id = ?";
            params.push(branch_id);
        }

        sql += " ORDER BY id DESC";
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("table.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        const { business_id } = req;
        const { branch_id, table_name } = req.body;

        // Format: [FrontendURL]/scan?biz=[business_id]&branch=[branch_id]&table=[table_name]
        // Try to get frontend URL from Referer/Origin or use a fallback for local testing
        let frontendUrl = "http://localhost:5173";
        if (req.headers.origin) {
            frontendUrl = req.headers.origin;
        } else if (req.headers.referer) {
            try { frontendUrl = new URL(req.headers.referer).origin; } catch (e) { }
        }

        const qr_code_url = `${frontendUrl}/scan?biz=${business_id}&branch=${branch_id}&table=${encodeURIComponent(table_name)}`;
        const qr_api_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr_code_url)}`;

        const sql = "INSERT INTO branch_tables (business_id, branch_id, table_name, qr_code_url) VALUES (?, ?, ?, ?)";
        const [data] = await db.query(sql, [business_id, branch_id, table_name, qr_code_url]);

        res.json({
            success: true,
            message: "Table created successfully!",
            id: data.insertId,
            qr_code_url: qr_api_url
        });
    } catch (error) {
        logError("table.create", error, res);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { business_id } = req;
        const { id, status } = req.body; // status: active, occupied, inactive

        const sql = "UPDATE branch_tables SET status = ? WHERE id = ? AND business_id = ?";
        await db.query(sql, [status, id, business_id]);

        res.json({ success: true, message: "Table status updated!" });
    } catch (error) {
        logError("table.updateStatus", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.body;
        const { business_id } = req;

        const sql = "DELETE FROM branch_tables WHERE id = ? AND business_id = ?";
        await db.query(sql, [id, business_id]);

        res.json({ success: true, message: "Table removed successfully!" });
    } catch (error) {
        logError("table.remove", error, res);
    }
};
