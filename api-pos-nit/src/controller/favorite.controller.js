const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const user_id = req.user_id;
        if (!user_id) return res.status(401).json({ message: "Unauthorized" });

        const [list] = await db.query(
            `SELECT p.*, bp.price, bp.cost_price, bp.stock_qty 
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       JOIN branch_products bp ON p.id = bp.product_id
       WHERE f.user_id = ?`,
            [user_id]
        );
        res.json({ list });
    } catch (error) {
        logError("favorite.getList", error, res);
    }
};

exports.toggle = async (req, res) => {
    try {
        const user_id = req.user_id;
        const { product_id } = req.body;
        if (!user_id) return res.status(401).json({ message: "Unauthorized" });

        const [exists] = await db.query(
            "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?",
            [user_id, product_id]
        );

        if (exists.length > 0) {
            await db.query("DELETE FROM favorites WHERE id = ?", [exists[0].id]);
            res.json({ success: true, isStarred: false, message: "Removed from favorites" });
        } else {
            await db.query("INSERT INTO favorites (user_id, product_id) VALUES (?, ?)", [user_id, product_id]);
            res.json({ success: true, isStarred: true, message: "Added to favorites" });
        }
    } catch (error) {
        logError("favorite.toggle", error, res);
    }
};
