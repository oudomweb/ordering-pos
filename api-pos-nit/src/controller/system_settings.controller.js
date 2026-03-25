const { db, logError } = require("../util/helper");
const fs = require('fs');
const path = require('path');

exports.getSystemSettings = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT sett_key, sett_value FROM system_settings");
        const settings = {};
        rows.forEach(row => {
            settings[row.sett_key] = row.sett_value;
        });
        res.json({ success: true, settings });
    } catch (error) {
        logError("system_settings.getSystemSettings", error, res);
    }
};

exports.updateSystemSettings = async (req, res) => {
    try {
        const params = req.body;
        const keys = Object.keys(params);

        if (req.file) {
            params['payway_khqr_image'] = req.file.filename;
            keys.push('payway_khqr_image');
        }

        // Handle image removal if requested
        if (params.image_remove === '1') {
            const [rows] = await db.query("SELECT sett_value FROM system_settings WHERE sett_key = 'payway_khqr_image'");
            if (rows.length > 0 && rows[0].sett_value) {
                const oldPath = path.join(__dirname, '../../public/images', rows[0].sett_value);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            params['payway_khqr_image'] = null;
            if (!keys.includes('payway_khqr_image')) keys.push('payway_khqr_image');
        }

        for (const key of keys) {
            // Only update keys that exist in our system
            await db.query(
                "UPDATE system_settings SET sett_value = ? WHERE sett_key = ?",
                [params[key], key]
            );
        }

        res.json({ success: true, message: "System settings updated successfully" });
    } catch (error) {
        logError("system_settings.updateSystemSettings", error, res);
    }
};
