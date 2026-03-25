const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { txtSearch } = req.query;

    let params = [business_id];
    let sql = "SELECT * FROM suppliers WHERE business_id = ?";

    if (txtSearch) {
      sql += " AND (name LIKE ? OR phone LIKE ?)";
      params.push(`%${txtSearch}%`, `%${txtSearch}%`);
    }

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("supplier.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { business_id } = req;
    const { name, phone, address } = req.body;

    const sql = "INSERT INTO suppliers (business_id, name, phone, address) VALUES (?, ?, ?, ?)";
    const [data] = await db.query(sql, [business_id, name, phone, address]);

    res.json({
      success: true,
      message: "Supplier added successfully!"
    });
  } catch (error) {
    logError("supplier.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { business_id } = req;
    const { id, name, phone, address } = req.body;

    const sql = "UPDATE suppliers SET name = ?, phone = ?, address = ? WHERE id = ? AND business_id = ?";
    await db.query(sql, [name, phone, address, id, business_id]);

    res.json({ message: "Supplier updated successfully!" });
  } catch (error) {
    logError("supplier.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    await db.query("DELETE FROM suppliers WHERE id = ? AND business_id = ?", [id, business_id]);
    res.json({ message: "Supplier removed successfully!" });
  } catch (error) {
    logError("supplier.remove", error, res);
  }
};
