
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cors({ origin: "*" }));
app.use('/public', express.static('public', {
  setHeaders: (res, path) => {
    if (path.includes('images') && !path.includes('.')) {
      res.set('Content-Type', 'image/jpeg');
    }
  }
}));

app.get("/api/ping", (req, res) => res.json({ status: "ok", time: new Date() }));

require("./src/route/auth.route")(app);
require("./src/route/user.route")(app);
require("./src/route/branch.route")(app);
require("./src/route/role.route")(app);
require("./src/route/category.route")(app);
require("./src/route/product.route")(app);
require("./src/route/expense.route")(app);
require("./src/route/order.route")(app);
require("./src/route/dashboard.route")(app);
require("./src/route/report.route")(app);
require("./src/route/supplier.route")(app);
require("./src/route/purchase.route")(app);
require("./src/route/raw_material.route")(app);
require("./src/route/config.route")(app);
require("./src/route/customer.route")(app);
require("./src/route/employee.route")(app);
require("./src/route/recipe.route")(app);
require("./src/route/permission.route")(app);
require("./src/route/plan.route")(app);
require("./src/route/business.route")(app);
require("./src/route/exchange.route")(app);
require("./src/route/payment.route")(app);
require("./src/route/stock.route")(app);
require("./src/route/table.route")(app);
require("./src/route/settings.route")(app);
require("./src/route/favorite.route")(app);
require("./src/route/shift.route")(app);


app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request entity too large' });
  }

  // Global Detailed Error Log
  console.error("🔥 Global Error Handler:", require("util").inspect(err, { depth: null, colors: true }));

  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal Server Error (Global)",
      message: err.message || "An unexpected error occurred."
    });
  }
});


const http = require('http');
const server = http.createServer({
  maxHeaderSize: 65536, // 64KB
  headersTimeout: 120000, // 2 minutes
  keepAliveTimeout: 120000, // 2 minutes
}, app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log("Server running on port " + PORT);

  // STEP 3: Start subscription auto-expiry cron job
  const { startSubscriptionCron } = require("./src/util/cron");
  startSubscriptionCron();

  // Migration Fix: Ensure orders table allows NULL for user_id
  const { db } = require("./src/util/helper");
  try {
    await db.query("ALTER TABLE orders MODIFY user_id INT NULL");
    console.log("Migration: 'orders.user_id' is now NULLABLE");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (orders.user_id) skipped:", err.message);
  }

  // Migration Fix: Ensure products table has 'brand' and 'discount' columns
  try {
    await db.query("ALTER TABLE products ADD COLUMN brand VARCHAR(255) AFTER barcode");
    console.log("Migration: Added 'brand' column to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.brand) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE products ADD COLUMN discount DOUBLE DEFAULT 0;");
    console.log("Migration: Added 'discount' column to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.discount) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE products ADD COLUMN sizes TEXT NULL AFTER image");
    await db.query("ALTER TABLE products ADD COLUMN addons TEXT NULL AFTER sizes");
    console.log("Migration: Added 'sizes' and 'addons' columns to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.sizes/addons) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE products ADD COLUMN description TEXT NULL AFTER name");
    console.log("Migration: Added 'description' column to products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (products.description) skipped:", err.message);
  }

  try {
    await db.query("ALTER TABLE branch_products ADD COLUMN min_stock_alert INT DEFAULT 5");
    console.log("Migration: Added 'min_stock_alert' column to branch_products");
  } catch (err) {
    if (!err.message.includes("Duplicate")) console.log("Migration (branch_products.min_stock_alert) skipped:", err.message);
  }

  // Migration Fix: Add missing categories once
  try {
    const bizId = 5;
    const cats = ['Juice', 'Milk', 'Snack', 'Rice', 'Dessert'];
    for (const name of cats) {
      const [rows] = await db.query("SELECT id FROM categories WHERE name = ? AND business_id = ?", [name, bizId]);
      if (rows.length === 0) {
        await db.query("INSERT INTO categories (business_id, name) VALUES (?, ?)", [bizId, name]);
        console.log(`Migration: Added missing category '${name}'`);
      }
    }
  } catch (err) { }

  // Migration Fix: Broaden orders table columns to prevent truncation
  try {
    await db.query("ALTER TABLE orders MODIFY payment_method VARCHAR(100) DEFAULT 'cash'");
    await db.query("ALTER TABLE orders MODIFY status VARCHAR(100) DEFAULT 'ordered'");
    await db.query("ALTER TABLE orders MODIFY order_type VARCHAR(100) DEFAULT 'dine_in'");
    console.log("Migration: 'orders' table columns are now flexible VARCHARs");
  } catch (err) {
    console.error("Migration Error (orders table):", err.message);
  }

  // Migration Fix: Ensure branch_products has default values for price/cost to prevent crashes
  try {
    await db.query("ALTER TABLE branch_products MODIFY price DOUBLE DEFAULT 0");
    await db.query("ALTER TABLE branch_products MODIFY cost_price DOUBLE DEFAULT 0");
    console.log("Migration: 'branch_products' default values set");
  } catch (err) {
    console.error("Migration Error (branch_products):", err.message);
  }

  // Migration Fix: Ensure businesses table has all setting columns
  try {
    await db.query("ALTER TABLE businesses ADD COLUMN address TEXT");
    await db.query("ALTER TABLE businesses ADD COLUMN website VARCHAR(255)");
    await db.query("ALTER TABLE businesses ADD COLUMN tax_percent DECIMAL(10, 2) DEFAULT 0");
    await db.query("ALTER TABLE businesses ADD COLUMN service_charge DECIMAL(10, 2) DEFAULT 0");
    await db.query("ALTER TABLE businesses ADD COLUMN kh_exchange_rate INT DEFAULT 4000");
    await db.query("ALTER TABLE businesses ADD COLUMN currency_symbol VARCHAR(10) DEFAULT '$'");
    await db.query("ALTER TABLE businesses ADD COLUMN telegram_link VARCHAR(255)");
    await db.query("ALTER TABLE businesses ADD COLUMN facebook_link VARCHAR(255)");
    console.log("Migration: 'businesses' table settings columns added");
  } catch (err) { }

  // Migration Fix: Add payment fields to branches table (Safe Check)
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM branches LIKE 'khqr_image'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE branches ADD COLUMN khqr_image VARCHAR(255) DEFAULT NULL");
      await db.query("ALTER TABLE branches ADD COLUMN payment_merchant_id VARCHAR(255) DEFAULT NULL");
      await db.query("ALTER TABLE branches ADD COLUMN payment_api_key VARCHAR(255) DEFAULT NULL");
      await db.query("ALTER TABLE branches ADD COLUMN payment_receiver_name VARCHAR(255) DEFAULT NULL");
      console.log("Migration: 'branches' payment fields added");
    }
  } catch (err) {
    console.error("Migration Error (branches table):", err.message);
  }

  // Migration Fix: Create system_settings table for platform-wide config
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sett_key VARCHAR(100) UNIQUE NOT NULL,
        sett_value TEXT DEFAULT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed default payment keys if missing
    const keys = ['payway_merchant_id', 'payway_api_key', 'payway_receiver_name', 'payway_khqr_image'];
    for (const key of keys) {
      await db.query("INSERT IGNORE INTO system_settings (sett_key) VALUES (?)", [key]);
    }

    console.log("Migration: 'system_settings' table ready");
  } catch (err) {
    console.error("Migration Error (system_settings):", err.message);
  }

  // Migration Fix: Create favorites table if missing
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Migration: 'favorites' table is ready");
  } catch (err) {
    console.error("Migration Error (favorites table):", err.message);
  }

  // Seeder: Add 25 products seeds (5 per new category)
  try {
    const bizId = 5;
    const [branches] = await db.query("SELECT id FROM branches WHERE business_id = ? LIMIT 1", [bizId]);
    const branchId = branches[0]?.id || 6;

    // Get modern category mapping
    const [dbCats] = await db.query("SELECT id, name FROM categories WHERE business_id = ?", [bizId]);
    const catMap = {};
    dbCats.forEach(c => catMap[c.name] = c.id);

    const productsToSeed = [
      { cat: 'Juice', name: 'Fresh Orange Juice', price: 2.5, img: 'orange_juice.png' },
      { cat: 'Juice', name: 'Apple Juice Delight', price: 2.5, img: 'apple_juice.png' },
      { cat: 'Juice', name: 'Watermelon Splash', price: 2.5, img: 'watermelon_juice.png' },
      { cat: 'Juice', name: 'Pineapple Glow', price: 2.5, img: 'pineapple_juice.png' },
      { cat: 'Juice', name: 'Tropical Mixed Juice', price: 3.0, img: 'tropical_juice.png' },

      { cat: 'Milk', name: 'Pure Fresh Milk', price: 2.0, img: 'pure_milk.png' },
      { cat: 'Milk', name: 'Soy Milk Classic', price: 2.5, img: 'soy_milk.png' },
      { cat: 'Milk', name: 'Almond Milk Silky', price: 3.0, img: 'almond_milk.png' },
      { cat: 'Milk', name: 'Strawberry Milk Dream', price: 2.5, img: 'strawberry_milk.png' },
      { cat: 'Milk', name: 'Rich Chocolate Milk', price: 2.5, img: 'chocolate_milk.png' },

      { cat: 'Snack', name: 'Chocolate Cookies', price: 1.5, img: 'cookies.png' },
      { cat: 'Snack', name: 'Potato Chips', price: 1.5, img: 'potato_chips.png' },
      { cat: 'Snack', name: 'Butter Popcorn', price: 2.0, img: 'snack_cat.png' },
      { cat: 'Snack', name: 'Spicy Nachos', price: 3.5, img: 'snack_cat.png' },
      { cat: 'Snack', name: 'Fudge Brownie', price: 2.5, img: 'snack_cat.png' },

      { cat: 'Rice', name: 'Shrimp Fried Rice', price: 4.5, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Golden Steam Rice', price: 1.0, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Garlic Rice', price: 1.5, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Pineapple Rice', price: 5.0, img: 'rice_cat.png' },
      { cat: 'Rice', name: 'Holy Basil Rice', price: 4.0, img: 'rice_cat.png' },

      { cat: 'Dessert', name: 'New York Cheesecake', price: 3.5, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Tiramisu Cup', price: 4.0, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Mango Sticky Rice', price: 3.5, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Premium Ice Cream', price: 2.5, img: 'dessert_cat.png' },
      { cat: 'Dessert', name: 'Delicate Fruit Tart', price: 3.0, img: 'dessert_cat.png' }
    ];

    for (const p of productsToSeed) {
      const catId = catMap[p.cat];
      if (!catId) continue;

      const [exists] = await db.query("SELECT id FROM products WHERE name = ? AND business_id = ?", [p.name, bizId]);
      if (exists.length === 0) {
        const [res] = await db.query(
          "INSERT INTO products (business_id, category_id, name, image, status) VALUES (?, ?, ?, ?, 1)",
          [bizId, catId, p.name, p.img]
        );
        const pid = res.insertId;
        await db.query(
          "INSERT IGNORE INTO branch_products (branch_id, product_id, price, cost_price, stock_qty) VALUES (?, ?, ?, ?, 100)",
          [branchId, pid, p.price, p.price * 0.5]
        );
        console.log(`Seeder: Added product '${p.name}'`);
      } else {
        // Update image if it's currently generic or placeholder
        await db.query("UPDATE products SET image = ? WHERE id = ?", [p.img, exists[0].id]);
        console.log(`Seeder: Updated image for product '${p.name}'`);
      }
    }
  } catch (err) {
    console.error("Seeder Error:", err.message);
  }
});

