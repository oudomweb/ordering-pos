const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { txt_search, status } = req.query;

        let sql = "SELECT * FROM raw_material WHERE business_id = ?";
        let params = [business_id];

        if (branch_id) {
            sql += " AND branch_id = ?";
            params.push(branch_id);
        }
        if (txt_search) {
            sql += " AND (name LIKE ? OR code LIKE ?)";
            params.push(`%${txt_search}%`, `%${txt_search}%`);
        }
        if (status) {
            sql += " AND status = ?";
            params.push(status);
        }

        sql += " ORDER BY id DESC";
        const [list] = await db.query(sql, params);
        res.json({ list });
    } catch (error) {
        logError("raw_material.getList", error, res);
    }
};

exports.create = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { name, code, unit, price, qty, min_stock, status } = req.body;
        const image = req.file?.filename || null;

        const sql = `
      INSERT INTO raw_material 
      (business_id, branch_id, name, code, unit, price, qty, min_stock, status, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const [data] = await db.query(sql, [
            business_id, branch_id, name, code, unit, price || 0, qty || 0, min_stock || 0, status || 1, image
        ]);

        res.json({ success: true, message: "Raw material added successfully!", data });
    } catch (error) {
        logError("raw_material.create", error, res);
    }
};

exports.update = async (req, res) => {
    try {
        const { business_id, branch_id } = req;
        const { id, name, code, unit, price, qty, min_stock, status } = req.body;
        const image = req.file?.filename || req.body.image;

        const sql = `
      UPDATE raw_material 
      SET name=?, code=?, unit=?, price=?, qty=?, min_stock=?, status=?, image=? 
      WHERE id=? AND business_id=?
    `;
        await db.query(sql, [
            name, code, unit, price, qty, min_stock, status, image, id, business_id
        ]);

        res.json({ success: true, message: "Raw material updated successfully!" });
    } catch (error) {
        logError("raw_material.update", error, res);
    }
};

exports.remove = async (req, res) => {
    try {
        const { business_id } = req;
        const { id } = req.body;
        await db.query("DELETE FROM raw_material WHERE id = ? AND business_id = ?", [id, business_id]);
        res.json({ message: "Raw material removed successfully!" });
    } catch (error) {
        logError("raw_material.remove", error, res);
    }
};
