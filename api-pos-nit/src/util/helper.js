const config = require("./config");
const connection = require("./connection");
const { logError } = require("./logError");
const multer = require("multer");
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret
});

exports.db = connection;
exports.logError = logError;

exports.toInt = () => {
  return true;
};

exports.isArray = (data) => {
  return true;
};

// exports.notEmpty = (value) => {
//   if (
//     value == "" ||
//     value == null ||
//     value == undefined ||
//     value == "null" ||
//     value == "undefined"
//   ) {
//     return false;
//   }
//   return true;
// };

exports.isEmpty = (value) => {
  if (
    value == "" ||
    value == null ||
    value == undefined ||
    value == "null" ||
    value == "undefined"
  ) {
    return true;
  }
  return false;
};

exports.isEmail = (data) => {
  return true;
};

exports.formartDateServer = (data) => {
  return true;
};

exports.formartDateClient = (data) => {
  return true;
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'coffee-pos',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const nameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
      return `img-${uniqueSuffix}`;
    }
  },
});

exports.uploadFile = multer({ storage: storage });

exports.removeFile = async (fileName) => {
  try {
    // If it's a Cloudinary public ID or URL
    if (fileName && !fileName.includes('/')) {
      // Simple filename: assume it's stored as public ID or we need to extract from local
      // But if we moved to cloud, the fileName stored in DB might be the public ID or full URL
      const publicId = fileName.split('.')[0];
      await cloudinary.uploader.destroy(`coffee-pos/${publicId}`);
    }
    return "Cloud file processed";
  } catch (err) {
    console.error("Cloud delete error:", err);
    return true;
  }
};





exports.generatePaymentLink = async ({ orderNo, total, customerEmail, customerName }) => {
  try {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: orderNo,
        amount: total,
        currency: "USD",
        redirect_url: "http://localhost:3000/payment-success",
        payment_options: "qr",
        customer: {
          email: customerEmail || "test@example.com",
          name: customerName || "Customer"
        },
        customizations: {
          title: "Srok Srae Coffee",
          description: `Order ${orderNo}`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.flutter_secret_key}` // 🔐 From your config.js
        }
      }
    );

    return response.data.data.link;
  } catch (err) {
    console.error("Error generating payment link:", err.response?.data || err.message);
    return null;
  }
};


exports.sendTelegramMessagenewcustomerOrder = async (messageText, imageUrls = []) => {
  const TELEGRAM_TOKEN = "7883883844:AAG_DsodDa-Y-zlgMmowlCxNwiQIVJO2kQI";
  const CHAT_ID = "-1002785760693";

  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  try {
    // 1. Send the text message
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });

    // 2. Send each image (if any)
    for (const imageUrl of imageUrls) {
      await axios.post(`${apiBase}/sendPhoto`, {
        chat_id: CHAT_ID,
        photo: imageUrl,
      });
    }

  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
};



exports.sendTelegramMessagenewLogin = async (messageText) => {
  const TELEGRAM_TOKEN = "8046971725:AAFt4UJ-2D9pRdwb-BOUj3we96pwL4vo3vU";
  const CHAT_ID = "-1002862378477"; // Your chat ID

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};
exports.checkPlanLimit = async (business_id, resourceType) => {
  // 1. Get business plan limits
  const [plan] = await connection.query(`
        SELECT p.* 
        FROM subscription_plans p
        INNER JOIN businesses b ON b.plan_id = p.id
        WHERE b.id = ?
    `, [business_id]);

  if (plan.length === 0) return { allowed: true }; // Fallback

  const limits = plan[0];
  let currentCount = 0;
  let maxLimit = 0;
  let errorMessage = "";

  if (resourceType === 'branch') {
    const [rows] = await connection.query("SELECT COUNT(id) as total FROM branches WHERE business_id = ?", [business_id]);
    currentCount = rows[0].total;
    maxLimit = limits.max_branches;
    errorMessage = `Your current plan allows only ${maxLimit} branch(es). Please upgrade to add more.`;
  } else if (resourceType === 'staff') {
    const [rows] = await connection.query("SELECT COUNT(id) as total FROM users WHERE business_id = ?", [business_id]);
    currentCount = rows[0].total;
    maxLimit = limits.max_staff;
    errorMessage = `Your current plan allows only ${maxLimit} staff members. Please upgrade to add more.`;
  } else if (resourceType === 'product') {
    const [rows] = await connection.query("SELECT COUNT(id) as total FROM products WHERE business_id = ?", [business_id]);
    currentCount = rows[0].total;
    maxLimit = limits.max_products;
    errorMessage = `Your current plan allows only ${maxLimit} products. Please upgrade to add more.`;
  }

  if (currentCount >= maxLimit) {
    return { allowed: false, message: errorMessage };
  }

  return { allowed: true };
};

