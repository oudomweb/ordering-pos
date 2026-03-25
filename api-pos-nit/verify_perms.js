const { db } = require('./src/util/helper');
async function run() {
    const [p] = await db.query("SELECT * FROM permissions WHERE name LIKE '%Ecosystem%' OR name LIKE '%business%' OR route_key LIKE '%business%'");
    console.log(JSON.stringify(p, null, 2));
    process.exit(0);
}
run().catch(console.error);
