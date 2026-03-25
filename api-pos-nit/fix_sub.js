const { db } = require("./src/util/helper");

async function run() {
    await db.query("UPDATE subscriptions SET tran_id = 'POS-1772636727817-DV5PW' WHERE id = 6");
    console.log("Updated sub #6 with valid tran_id");
    process.exit(0);
}
run();

