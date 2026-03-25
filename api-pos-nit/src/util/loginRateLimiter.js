const rateLimit = require("express-rate-limit");

const memory = new Map();

const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // default: 5 minutes
  max: 5,
  keyGenerator: (req) => req.ip,
  handler: (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    const attempt = memory.get(ip) || {
      count: 1,
      firstAttempt: now,
      blockUntil: null,
    };

    if (attempt.blockUntil && now < attempt.blockUntil) {
      return res.status(429).json({
        message: `អ្នកត្រូវរងចាំ ${Math.ceil((attempt.blockUntil - now) / 60000)} នាទីមុនពេលសាកល្បងម្តងទៀត។`,
      });
    }

    if (attempt.count >= 5) {
      // Determine delay duration
      let delay;
      if (!attempt.delayStage || attempt.delayStage === 1) {
        delay = 15 * 60 * 1000; // 15 mins
        attempt.delayStage = 2;
      } else if (attempt.delayStage === 2) {
        delay = 30 * 60 * 1000; // 30 mins
        attempt.delayStage = 3;
      } else {
        delay = 30 * 60 * 1000; // always 30 mins after
      }

      attempt.blockUntil = now + delay;
      attempt.count = 0;

      memory.set(ip, attempt);
      return res.status(429).json({
        message: `អ្នកបានស្នើច្រើនពេក! សូមរងចាំ ${delay / 60000} នាទី។`,
      });
    }

    attempt.count += 1;
    memory.set(ip, attempt);
    next();
  },
});

module.exports = loginRateLimiter;
