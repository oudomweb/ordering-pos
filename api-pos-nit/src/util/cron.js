const cron = require("node-cron");
const { db } = require("./helper");

/**
 * STEP 3: Auto-Expiry Cron Job
 * Runs every day at 00:05 AM (server time)
 * - Finds businesses with expired subscriptions
 * - Auto-downgrades them to Free Plan (plan_id = 1)
 * - Updates their owner role permissions accordingly
 */
const startSubscriptionCron = () => {
    // Run daily at 00:05 AM
    cron.schedule("5 0 * * *", async () => {
        console.log("[CRON] Running subscription expiry check at", new Date().toISOString());

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Find all active subscriptions that have expired
            const [expiredSubs] = await conn.query(`
                SELECT s.business_id, s.id as sub_id
                FROM subscriptions s
                WHERE s.status = 'active'
                  AND s.end_date < CURDATE()
            `);

            if (expiredSubs.length === 0) {
                console.log("[CRON] No expired subscriptions found.");
                await conn.commit();
                return;
            }

            console.log(`[CRON] Found ${expiredSubs.length} expired subscription(s). Processing...`);

            for (const sub of expiredSubs) {
                const { business_id, sub_id } = sub;

                // 2. Mark subscription as expired
                await conn.query(
                    "UPDATE subscriptions SET status = 'expired' WHERE id = ?",
                    [sub_id]
                );

                // 3. Downgrade business back to Free Plan (id = 1)
                await conn.query(
                    "UPDATE businesses SET plan_id = 1 WHERE id = ?",
                    [business_id]
                );

                // 4. Remove permissions that are above Free Plan from owner role
                const [ownerRoles] = await conn.query(
                    "SELECT id FROM roles WHERE business_id = ? AND code = 'owner'",
                    [business_id]
                );

                if (ownerRoles.length > 0) {
                    const ownerRoleId = ownerRoles[0].id;
                    // Remove permissions that require plan > 1 (Free Plan)
                    await conn.query(`
                        DELETE FROM role_permissions
                        WHERE role_id = ?
                          AND permission_id IN (
                              SELECT id FROM permissions WHERE min_plan_id > 1
                          )
                    `, [ownerRoleId]);
                }

                console.log(`[CRON] Business ID ${business_id} downgraded to Free Plan.`);
            }

            await conn.commit();
            console.log("[CRON] Subscription expiry check completed.");
        } catch (error) {
            await conn.rollback();
            console.error("[CRON ERROR] Subscription expiry check failed:", error.message);
        } finally {
            conn.release();
        }
    });

    console.log("[CRON] Subscription expiry scheduler started. Runs daily at 00:05 AM.");
};

module.exports = { startSubscriptionCron };
