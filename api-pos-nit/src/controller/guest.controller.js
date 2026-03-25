const { db, logError } = require("../util/helper");
const jwt = require("jsonwebtoken");
const config = require("../util/config");

// This generates a guest token that allows users to place orders and view products/categories
// No login required, but we verify business_id and branch_id
exports.guestAccess = async (req, res) => {
    try {
        const { biz, branch, table } = req.query;

        // Verify business and branch exist
        const [bizRows] = await db.query("SELECT id, name FROM businesses WHERE id = ? AND status = 'active'", [biz]);
        if (bizRows.length === 0) return res.status(404).json({ message: "Shop not found or inactive" });

        const [branchRows] = await db.query("SELECT id, name FROM branches WHERE id = ? AND business_id = ?", [branch, biz]);
        if (branchRows.length === 0) return res.status(404).json({ message: "Branch not found" });

        // Minimal guest payload
        const payload = {
            business_id: parseInt(biz),
            branch_id: parseInt(branch),
            table_no: table || "Walk-in",
            role_code: "guest",
            permissions: ["product", "category", "order"] // Essential for ordering
        };

        const token = jwt.sign(payload, config.token.access_token_key, { expiresIn: "4h" });

        res.json({
            access_token: token,
            permissions: payload.permissions,
            profile: {
                business_id: payload.business_id,
                branch_id: payload.branch_id,
                business_name: bizRows[0].name,
                branch_name: branchRows[0].name,
                table_no: table
            }
        });
    } catch (error) {
        logError("guest.access", error, res);
    }
};
