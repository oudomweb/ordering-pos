const { db, logError } = require("../util/helper");

exports.getSettings = async (req, res) => {
    try {
        const { business_id } = req;
        const [data] = await db.query(
            "SELECT name, owner_name, email, phone, logo, address, website, tax_percent, service_charge, kh_exchange_rate, currency_symbol, telegram_link, facebook_link FROM businesses WHERE id = ?",
            [business_id]
        );

        if (data.length === 0) {
            return res.status(404).json({ message: "Business not found" });
        }

        res.json({ settings: data[0] });
    } catch (error) {
        logError("settings.getSettings", error, res);
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { business_id } = req;
        const {
            name, owner_name, email, phone, address, website,
            tax_percent, service_charge, kh_exchange_rate,
            currency_symbol, telegram_link, facebook_link
        } = req.body;

        const logo = req.file?.path || req.file?.filename;

        let sql = `
      UPDATE businesses SET 
        name = ?, owner_name = ?, email = ?, phone = ?, address = ?, website = ?,
        tax_percent = ?, service_charge = ?, kh_exchange_rate = ?,
        currency_symbol = ?, telegram_link = ?, facebook_link = ?
    `;
        let params = [
            name, owner_name, email, phone, address, website,
            tax_percent, service_charge, kh_exchange_rate,
            currency_symbol, telegram_link, facebook_link
        ];

        if (logo) {
            sql += ", logo = ?";
            params.push(logo);
        }

        sql += " WHERE id = ?";
        params.push(business_id);

        await db.query(sql, params);

        res.json({
            success: true,
            message: "Settings updated successfully",
            logo: logo // return the new logo filename
        });
    } catch (error) {
        logError("settings.updateSettings", error, res);
    }
};
