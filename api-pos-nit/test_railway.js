
const mysql = require("mysql2/promise");

async function test() {
    try {
        const connection = await mysql.createConnection("mysql://root:YqQSkpUuUStPjQjscjEAnxTfGbeXUjZJ@roundhouse.proxy.rlwy.net:47416/railway");
        const [rows] = await connection.execute("SELECT 1+1 as result");
        console.log("Connection result:", rows[0].result);
        await connection.end();
    } catch (err) {
        console.error("Test Error:", err.message);
    }
}
test();
