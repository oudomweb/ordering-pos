const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { business_id } = req;

    const [categories] = await db.query(
      "SELECT id AS value, name AS label FROM categories WHERE business_id = ?",
      [business_id]
    );

    const [roles] = await db.query(
      "SELECT id AS value, name AS label FROM roles WHERE business_id = ?",
      [business_id]
    );

    const [suppliers] = await db.query(
      "SELECT id AS value, name AS label FROM suppliers WHERE business_id = ?",
      [business_id]
    );

    const [expense_types] = await db.query(
      "SELECT id AS value, name AS label FROM expense_type WHERE business_id = ?",
      [business_id]
    );

    const [branches] = await db.query(
      "SELECT id AS value, name AS label FROM branches WHERE business_id = ?",
      [business_id]
    );

    const [users] = await db.query(
      "SELECT id AS value, name AS label FROM users WHERE business_id = ?",
      [business_id]
    );

    res.json({
      category: categories,
      role: roles,
      supplier: suppliers,
      expense_type: expense_types,
      branches: branches,
      user: users,
      brand: [
        { label: "Green Grounds", value: "green-grounds" },
        { label: "Local Coffee", value: "local" }
      ],
      unit: [
        { label: "Cup", value: "cup" },
        { label: "Bottle", value: "bottle" },
        { label: "kg", value: "kg" },
        { label: "Set", value: "set" }
      ]
    });
  } catch (error) {
    logError("config.getList", error, res);
  }
};

exports.getProductConfig = async (req, res) => {
  try {
    const { product_id } = req.params;
    // Assuming variations for now, though schema is slightly different
    const [variations] = await db.query(
      "SELECT vo.id AS value, vo.label AS name, vo.extra_price as price FROM variation_options vo JOIN variations v ON vo.variation_id = v.id WHERE v.id = ?",
      [product_id]
    );

    res.json({
      getSizes: variations,
      getAddons: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};