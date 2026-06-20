const Redis = require("ioredis");
const env = require("../config/env");

const redis = new Redis(env.redisUrl || "redis://localhost:6379");

/**
 * Cache middleware with cache-aside pattern
 * Intercepts GET requests and caches responses with TTL
 */
function cacheMiddleware(ttlSeconds = 600) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      const cacheKey = `cache:search:${req.originalUrl || req.url}`;

      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.set("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(body) {
        try {
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(body));
        } catch (error) {
          console.error("Cache error:", error.message);
        }
        res.set("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error.message);
      next();
    }
  };
}

module.exports = {
  cacheMiddleware,
  redis
};
