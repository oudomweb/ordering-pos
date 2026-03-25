const jwt = require("jsonwebtoken");
const config = require("./src/util/config");

const payload = { user_id: 1, business_id: 1 };
const token = jwt.sign(payload, config.token.access_token_key);
console.log("Token generated with key:", config.token.access_token_key);

try {
    const decoded = jwt.verify(token, config.token.access_token_key);
    console.log("Token verified successfully:", decoded);
} catch (e) {
    console.error("Verification failed:", e.message);
}
