const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { txtSearch } = req.query;
    let sql = `
      SELECT id, name, 
        CASE WHEN gender = 1 THEN 'Male' ELSE 'Female' END AS gender,
        position, salary, tel, email, address, create_at
      FROM employee 
      WHERE business_id = ?
    `;

    if (!isEmpty(txtSearch)) {
      sql += " AND (name LIKE ? OR tel LIKE ? OR email LIKE ?)";
    }

    const [list] = await db.query(sql, [
      business_id,
      `%${txtSearch}%`, `%${txtSearch}%`, `%${txtSearch}%`
    ]);

    res.json({
      list,
    });
  } catch (error) {
    logError("employee.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name, position, salary, gender, tel, email, address
    } = req.body;
    const { business_id, branch_id } = req;

    // Convert gender from "Male"/"Female" to 1/0
    const genderValue = gender === "Male" ? 1 : 0;

    const sql = `
      INSERT INTO employee 
        (business_id, branch_id, name, position, salary, gender, tel, email, address, create_at) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [data] = await db.query(sql, [
      business_id, branch_id, name, position, salary, genderValue, tel, email, address
    ]);

    res.json({
      data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("employee.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      id, name, position, salary, gender, tel, email, address
    } = req.body;
    const { business_id } = req;

    const genderValue = gender === "Male" ? 1 : 0;

    const sql = `
      UPDATE employee 
      SET 
        name = ?, position = ?, salary = ?, gender = ?, tel = ?, email = ?, address = ?
      WHERE id = ? AND business_id = ?
    `;

    const [data] = await db.query(sql, [
      name, position, salary, genderValue, tel, email, address, id, business_id
    ]);

    res.json({
      data,
      message: "Update success!",
    });
  } catch (error) {
    logError("employee.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    const [data] = await db.query("DELETE FROM employee WHERE id = ? AND business_id = ?", [
      id, business_id
    ]);

    res.json({
      data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("employee.remove", error, res);
  }
};