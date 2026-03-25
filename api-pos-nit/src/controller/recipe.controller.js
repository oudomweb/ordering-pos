const {
    db,
    isArray,
    isEmpty,
    logError,
} = require("../util/helper");


exports.getRecipe = async (req, res) => {
    try {
        const { product_id } = req.query;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        const sql = `
      SELECT 
        rd.id, 
        rd.qty, 
        rd.unit, 
        rm.id as raw_material_id, 
        rm.name, 
        rm.code, 
        rm.unit as base_unit, 
        rm.price as cost_price
      FROM recipe_detail rd
      INNER JOIN raw_material rm ON rd.raw_material_id = rm.id
      WHERE rd.product_id = :product_id
    `;

        const [list] = await db.query(sql, { product_id });

        res.json({
            list: list,
            total: list.length
        });
    } catch (error) {
        logError("recipe.getRecipe", error, res);
    }
};

exports.saveRecipe = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { product_id, ingredients } = req.body; // ingredients = [{ raw_material_id, qty, unit }]

        if (!product_id || !ingredients || !isArray(ingredients)) {
            return res.status(400).json({ error: "Invalid input" });
        }

        // 1. Clear existing recipe for this product
        await connection.query("DELETE FROM recipe_detail WHERE product_id = ?", [product_id]);

        // 2. Insert new ingredients
        if (ingredients.length > 0) {
            const sql = "INSERT INTO recipe_detail (product_id, raw_material_id, qty, unit) VALUES ?";
            const values = ingredients.map(ing => [product_id, ing.raw_material_id, ing.qty, ing.unit]);
            await connection.query(sql, [values]);
        }

        // 3. Update product type to 'recipe' if it has ingredients
        // optimize: only update if changed
        await connection.query("UPDATE product SET product_type = 'recipe' WHERE id = ?", [product_id]);

        await connection.commit();

        res.json({
            message: "Recipe saved successfully!",
            ingredients_count: ingredients.length
        });

    } catch (error) {
        await connection.rollback();
        logError("recipe.saveRecipe", error, res);
    } finally {
        connection.release();
    }
};

exports.removeRecipe = async (req, res) => {
    try {
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        await db.query("DELETE FROM recipe_detail WHERE product_id = :product_id", { product_id });

        // Reset product type to 'ready'? Maybe user wants to keep it as recipe but empty. Let's keep it simple.
        // If no recipe, it's virtually 'ready' or just empty recipe.

        res.json({
            message: "Recipe deleted successfully!"
        });
    } catch (error) {
        logError("recipe.removeRecipe", error, res);
    }
};
