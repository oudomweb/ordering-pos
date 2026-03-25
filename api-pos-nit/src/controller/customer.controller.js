const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { txtSearch } = req.query;

    let params = [business_id];
    let sql = "SELECT * FROM customers WHERE business_id = ?";

    if (txtSearch) {
      sql += " AND (name LIKE ? OR phone LIKE ?)";
      params.push(`%${txtSearch}%`, `%${txtSearch}%`);
    }

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("customer.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { business_id } = req;
    const { name, phone, email, address } = req.body;

    const sql = "INSERT INTO customers (business_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)";
    const [data] = await db.query(sql, [business_id, name, phone, email, address]);

    res.json({
      success: true,
      message: "Customer created successfully!",
      id: data.insertId
    });
  } catch (error) {
    logError("customer.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { business_id } = req;
    const { id, name, phone, email, address } = req.body;

    const sql = "UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND business_id = ?";
    await db.query(sql, [name, phone, email, address, id, business_id]);

    res.json({ message: "Customer updated successfully!" });
  } catch (error) {
    logError("customer.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    await db.query("DELETE FROM customers WHERE id = ? AND business_id = ?", [id, business_id]);
    res.json({ message: "Customer removed successfully!" });
  } catch (error) {
    logError("customer.remove", error, res);
  }
};
