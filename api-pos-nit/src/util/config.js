module.exports = {
  db: {
    // Switch between local and production easily
    // In .env, set APP_ENV=local or APP_ENV=production
    HOST: process.env.APP_ENV === 'production' ? process.env.DB_PROD_HOST : (process.env.DB_HOST || "localhost"),
    USER: process.env.APP_ENV === 'production' ? process.env.DB_PROD_USER : (process.env.DB_USER || "root"),
    PASSWORD: process.env.APP_ENV === 'production' ? process.env.DB_PROD_PASSWORD : (process.env.DB_PASSWORD || ""),
    DATABASE: process.env.APP_ENV === 'production' ? process.env.DB_PROD_DATABASE : (process.env.DB_DATABASE || "coffee_saas"),
    PORT: process.env.APP_ENV === 'production' ? process.env.DB_PROD_PORT : (process.env.DB_PORT || 3306),
  },
  platform_api_url: process.env.VITE_PLATFORM_API_URL || "https://platformsapi-production.up.railway.app/api",
  platform_hub_url: process.env.VITE_PLATFORM_HUB_URL || "https://platformhub-production.up.railway.app",
  token: {
    access_token_key: process.env.ACCESS_TOKEN_KEY || "your_secret_key",
    refresh_token_key: process.env.REFRESH_TOKEN_KEY || "your_refresh_secret_key",
  },
  image_path: process.env.IMAGE_PATH || "public/images/",
  flutter_secret_key: process.env.FLUTTER_SECRET_KEY || "FLWSECK_TEST-51f96fcfc9d06ac2d35ed8a01a523fae-X",

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  // ─── PayWay (ABA Bank Cambodia) ───────────────────────────────
  payway: {
    merchant_id: process.env.PAYWAY_MERCHANT_ID || "demo_merchant",
    api_key: process.env.PAYWAY_API_KEY || "demo_api_key",
    base_url: process.env.PAYWAY_BASE_URL || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments",
    callback_url: process.env.PAYWAY_CALLBACK_URL || "http://localhost:8080/api/payment/callback",
    return_url: process.env.PAYWAY_RETURN_URL || "http://localhost:5173/payment/result",
  },
  // ──────────────────────────────────────────────────────────────

  app_url: process.env.APP_URL || "http://localhost:5173",
};

