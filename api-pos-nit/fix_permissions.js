const mysql = require("mysql2/promise");
require("dotenv").config();

async function fixPermissions() {
    // We'll try to update the Local DB as specified in .env
    const isProd = process.env.APP_ENV !== "local";
    const config = {
        host: isProd ? process.env.DB_PROD_HOST : process.env.DB_HOST,
        user: isProd ? process.env.DB_PROD_USER : process.env.DB_USER,
        password: isProd ? process.env.DB_PROD_PASSWORD : process.env.DB_PASSWORD,
        database: isProd ? process.env.DB_PROD_DATABASE : process.env.DB_DATABASE,
        port: isProd ? process.env.DB_PROD_PORT : process.env.DB_PORT,
    };

    console.log(`🚀 Connecting to ${isProd ? 'Production (Railway)' : 'Local'} DB...`);

    try {
        const connection = await mysql.createConnection(config);
        console.log("✅ Connected successfully!");

        // 1. Identify shop-level operational permissions by their route keys
        const shopOpRoutes = [
            '/invoices', 
            '/product', 
            '/category', 
            '/order', 
            '/purchase', 
            '/supplier', 
            '/raw_material', 
            '/report_Sale_Summary', 
            '/report_Expense_Summary', 
            '/Top_Sale', 
            '/expense', 
            '/stock', 
            'stock/adjust', 
            '/table', 
            '/my-plan'
        ];

        console.log("⚠️  Starting permission cleanup for SaaS Administrator (Role ID: 1)...");

        // Use a subquery to find permission IDs for these routes
        // We delete from role_permissions where role_id is 1 and permission_id matches shop routes
        const [result] = await connection.query(`
            DELETE FROM role_permissions 
            WHERE role_id = 1 
            AND permission_id IN (
                SELECT id FROM permissions WHERE route_key IN (?)
            )
        `, [shopOpRoutes]);

        console.log(`✨ Cleanup Complete! Removed ${result.affectedRows} shop-operational permissions from the Super Admin role.`);

        // 2. Double check remaining permissions
        const [remaining] = await connection.query(`
            SELECT p.name, p.route_key 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = 1
        `);
        
        console.log("\n🔐 Final Permitted Modules for SaaS Owner:");
        console.table(remaining);

        await connection.end();
    } catch (err) {
        console.error("❌ Database Error:", err.message);
    }
}

fixPermissions();
