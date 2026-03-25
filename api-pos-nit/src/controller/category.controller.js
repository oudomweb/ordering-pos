const { db, logError } = require("../util/helper");

// 1. Get List of Categories (Business Specific)
exports.getList = async (req, res) => {
  try {
    const { business_id } = req;
    const sql = `
        SELECT c.* 
        FROM categories c
        WHERE c.business_id = ?
        ORDER BY c.id DESC
    `;
    const [list] = await db.query(sql, [business_id]);
    res.json({ list });
  } catch (error) {
    logError("category.getList", error, res);
  }
};

// 2. Create Category
exports.create = async (req, res) => {
  try {
    const { name, image } = req.body;
    const { business_id } = req;

    const sql = "INSERT INTO categories (business_id, name, image) VALUES (?, ?, ?)";
    const [data] = await db.query(sql, [business_id, name, image]);

    res.json({
      success: true,
      data,
      message: "Category created successfully!"
    });
  } catch (error) {
    logError("category.create", error, res);
  }
};

// 3. Update Category
exports.update = async (req, res) => {
  try {
    const { id, name, image } = req.body;
    const { business_id } = req;

    const sql = "UPDATE categories SET name = ?, image = ? WHERE id = ? AND business_id = ?";
    const [data] = await db.query(sql, [name, image, id, business_id]);

    res.json({
      success: true,
      message: "Category updated successfully!"
    });
  } catch (error) {
    logError("category.update", error, res);
  }
};

// 4. Remove Category
exports.remove = async (req, res) => {
  try {
    const { id } = req.body;
    const { business_id } = req;

    // Check if category has products
    const [products] = await db.query("SELECT id FROM products WHERE category_id = ? LIMIT 1", [id]);
    if (products.length > 0) {
      return res.status(400).json({ message: "Cannot delete category with products!" });
    }

    const sql = "DELETE FROM categories WHERE id = ? AND business_id = ?";
    await db.query(sql, [id, business_id]);

    res.json({ message: "Category removed successfully!" });
  } catch (error) {
    logError("category.remove", error, res);
  }
};