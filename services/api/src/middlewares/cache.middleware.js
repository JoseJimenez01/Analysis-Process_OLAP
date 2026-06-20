const Redis = require("ioredis");
const env = require("../config/env");

const redis = new Redis(env.redisUrl);

/**
 * Cache middleware with cache-aside pattern
 * Intercepts GET requests and caches responses with TTL
 * Invalidates cache on POST/PUT/DELETE
 */
function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      const cacheKey = `cache:${req.originalUrl || req.url}`;

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

/**
 * Cache invalidation middleware
 * Clears cache on POST/PUT/DELETE operations
 */
function invalidateCacheMiddleware() {
  return async (req, res, next) => {
    if (!["POST", "PUT", "DELETE"].includes(req.method)) {
      return next();
    }

    // Store original res methods
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after successful operation
    res.json = function(body) {
      // Only invalidate on success (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Invalidate patterns based on route
          const patterns = [
            "cache:/api/products*",
            "cache:/api/menus*",
            "cache:/api/categories*",
            "cache:/search/products*"
          ];

          patterns.forEach(async (pattern) => {
            try {
              let cursor = "0";
              do {
                const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                  await redis.unlink(...keys);
                }
              } while (cursor !== "0");
            } catch (err) {
              console.error("Cache invalidation error:", err.message);
            }
          });
        } catch (error) {
          console.error("Cache invalidation error:", error.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Clear all cache
 */
async function clearAllCache() {
  try {
    await redis.flushdb();
  } catch (error) {
    console.error("Error clearing cache:", error.message);
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  clearAllCache,
  redis
};
