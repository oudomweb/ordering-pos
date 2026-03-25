const mysql = require("mysql2/promise");
require("dotenv").config();

async function restore() {
  const isProd = process.env.APP_ENV !== "local";
  const config = {
    host: isProd ? process.env.DB_PROD_HOST : process.env.DB_HOST,
    user: isProd ? process.env.DB_PROD_USER : process.env.DB_USER,
    password: isProd ? process.env.DB_PROD_PASSWORD : process.env.DB_PASSWORD,
    database: isProd ? process.env.DB_PROD_DATABASE : process.env.DB_DATABASE,
    port: isProd ? process.env.DB_PROD_PORT : process.env.DB_PORT,
  };

  console.log(`Restoring permissions in ${isProd ? 'Production' : 'Local'} DB...`);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log("Connected successfully!");

    // 1. Give ALL permissions to all roles named 'Owner' or with code 'owner' or 'OWNER'
    // This will fix the user's access immediately.
    const [roles] = await connection.query("SELECT id FROM roles WHERE LOWER(code) = 'owner' OR LOWER(name) = 'owner'");
    const roleIds = roles.map(r => r.id);

    if (roleIds.length > 0) {
        console.log(`Found ${roleIds.length} Owner roles to fix...`);
        
        // Use a loop to restore all perms for each role
        for (const roleId of roleIds) {
            console.log(`Restoring perms for Role ID: ${roleId}`);
            // INSERT IGNORE to avoid duplicates
            await connection.query(`
                INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT ?, id FROM permissions
            `, [roleId]);
        }
        console.log("✅ Restoration Complete! ALL Owner permissions have been restored.");
    } else {
        console.log("No Owner roles found to restore.");
    }

    // Also restore Super Admin (Role 1) just in case
    await connection.query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT 1, id FROM permissions
    `);
    console.log("✅ Super Admin permissions restored.");

    await connection.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

restore();
