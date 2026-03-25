const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const { target_business_id } = req.query; // Super Admin can filter by business

    let sql = "SELECT * FROM roles WHERE business_id = ?";
    let params = [business_id];

    // Platform Owner (Biz 1) can see any business's roles
    if (business_id === 1 && target_business_id) {
      sql = "SELECT * FROM roles WHERE business_id = ?";
      params = [target_business_id];
    } else if (business_id === 1 && !target_business_id) {
       // Optional: List ALL roles or just Biz 1? Let's stay with Biz 1 by default or add a flag
       sql = "SELECT * FROM roles";
       params = [];
    }

    const [list] = await db.query(sql, params);
    res.json({
      list: list,
    });
  } catch (error) {
    logError("role.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { business_id: my_business_id } = req;
    const { name, code, business_id } = req.body;
    
    // Default to own business, unless Platform Owner specifies another
    const target_business_id = (my_business_id === 1 && business_id) ? business_id : my_business_id;

    const sql = "INSERT INTO roles (business_id, name, code) VALUES (?, ?, ?)";
    const [data] = await db.query(sql, [target_business_id, name, code]);
    res.json({
      data: data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("role.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { business_id: my_business_id } = req;
    const { id, name, code, business_id } = req.body;

    // Platform Owner can update any role, others only their own business's roles
    const sql = my_business_id === 1 
      ? "UPDATE roles SET name = ?, code = ? WHERE id = ?"
      : "UPDATE roles SET name = ?, code = ? WHERE id = ? AND business_id = ?";
    
    const params = my_business_id === 1
      ? [name, code, id]
      : [name, code, id, my_business_id];

    const [data] = await db.query(sql, params);
    res.json({
      data: data,
      message: "Data update success!",
    });
  } catch (error) {
    logError("role.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { business_id: my_business_id } = req;
    const { id } = req.body;

    const sql = my_business_id === 1
      ? "DELETE FROM roles WHERE id = ?"
      : "DELETE FROM roles WHERE id = ? AND business_id = ?";
    
    const params = my_business_id === 1 ? [id] : [id, my_business_id];

    const [data] = await db.query(sql, params);
    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("role.remove", error, res);
  }
};
