const { db, logError } = require("../util/helper");

exports.getExchangeRate = async (req, res) => {
    try {
        const { business_id } = req;
        const [data] = await db.query(
            "SELECT kh_exchange_rate FROM businesses WHERE id = ?",
            [business_id]
        );

        let rate = 4000; // Default fallback
        if (data && data.length > 0) {
            rate = data[0].kh_exchange_rate || 4000;
        }

        res.json({
            list: [
                { id: 1, currency: "KHR", rate: rate, updated_at: new Date() }
            ],
            live_rate: rate,
            success: true
        });
    } catch (error) {
        logError("exchange.getExchangeRate", error, res);
    }
};

exports.getBalanceData = async (req, res) => {
    try {
        res.json({
            data: [
                { currency: "USD", availableBalance: "$45,680.00", flag: "🇺🇸", gradient: "linear-gradient(135deg, #1e4a2d 0%, #2d6a3e 100%)" },
                { currency: "KHR", availableBalance: "៛12,500,000", flag: "🇰🇭", gradient: "linear-gradient(135deg, #c0a060 0%, #d4af37 100%)" },
                { currency: "EUR", availableBalance: "€1,250.00", flag: "🇪🇺", gradient: "linear-gradient(135deg, #2b32b2 0%, #1477d2 100%)" }
            ],
            success: true
        });
    } catch (error) {
        logError("exchange.getBalanceData", error, res);
    }
};

exports.getTransactions = async (req, res) => {
    try {
        res.json({
            list: [
                { id: 1, date: "2024-03-04", type: "Exchange", amount: "$500.00", reference: "REF-82930", status: "Completed", fromCurrency: "USD", toCurrency: "KHR" },
                { id: 2, date: "2024-03-03", type: "Receive", amount: "$1,200.00", reference: "REF-10293", status: "Completed" },
                { id: 3, date: "2024-03-02", type: "Send", amount: "$300.00", reference: "REF-55201", status: "Pending" }
            ],
            success: true
        });
    } catch (error) {
        logError("exchange.getTransactions", error, res);
    }
};
