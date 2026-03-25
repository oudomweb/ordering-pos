const mysql = require("mysql2/promise");
require("dotenv").config();

async function check() {
  const isProd = process.env.APP_ENV !== "local";
  const config = {
    host: isProd ? process.env.DB_PROD_HOST : process.env.DB_HOST,
    user: isProd ? process.env.DB_PROD_USER : process.env.DB_USER,
    password: isProd ? process.env.DB_PROD_PASSWORD : process.env.DB_PASSWORD,
    database: isProd ? process.env.DB_PROD_DATABASE : process.env.DB_DATABASE,
    port: isProd ? process.env.DB_PROD_PORT : process.env.DB_PORT,
  };

  console.log(`Connecting to ${isProd ? 'Production (Railway)' : 'Local'} DB...`);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log("Connected successfully!");

    const [rolePerms] = await connection.query(`
        SELECT r.name as role_name, p.name as permission_name, p.route_key
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE r.id = 1
    `);
    console.log("Current Permissions for Super Admin (Role 1):");
    console.table(rolePerms);

    await connection.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

check();
