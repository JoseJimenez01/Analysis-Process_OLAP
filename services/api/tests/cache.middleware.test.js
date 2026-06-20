const express = require("express");
const request = require("supertest");

// Create mock Redis instance BEFORE requiring the middleware
const mockRedisInstance = {
  get: jest.fn(),
  setex: jest.fn(),
  scan: jest.fn(),
  unlink: jest.fn(),
  flushdb: jest.fn(),
  status: "ready"
};

jest.mock("ioredis", () => {
  return jest.fn(() => mockRedisInstance);
});

const { cacheMiddleware, invalidateCacheMiddleware, clearAllCache } = require("../src/middlewares/cache.middleware");

describe("cache middleware", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  describe("cacheMiddleware", () => {
    it("returns MISS and caches response on first GET", async () => {
      app.use("/api/test", cacheMiddleware(300));
      app.get("/api/test", (req, res) => {
        res.json({ data: "test" });
      });

      mockRedisInstance.get.mockResolvedValue(null);
      mockRedisInstance.setex.mockResolvedValue("OK");

      const response = await request(app).get("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-cache"]).toBe("MISS");
      expect(response.body).toEqual({ data: "test" });
    });

    it("returns HIT and cached response on second GET", async () => {
      app.use("/api/test", cacheMiddleware(300));
      app.get("/api/test", (req, res) => {
        res.json({ data: "test" });
      });

      mockRedisInstance.get.mockResolvedValue(JSON.stringify({ data: "cached" }));

      const response = await request(app).get("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-cache"]).toBe("HIT");
      expect(response.body).toEqual({ data: "cached" });
    });

    it("does not cache non-GET requests", async () => {
      app.use(cacheMiddleware(300));
      app.post("/api/test", (req, res) => {
        res.json({ created: true });
      });

      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedisInstance.get).not.toHaveBeenCalled();
    });

    it("handles cache errors gracefully", async () => {
      app.use(cacheMiddleware(300));
      app.get("/api/test", (req, res) => {
        res.json({ data: "test" });
      });

      mockRedisInstance.get.mockRejectedValue(new Error("Redis error"));

      const response = await request(app).get("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ data: "test" });
    });
  });

  describe("invalidateCacheMiddleware", () => {
    it("invalidates cache on POST", async () => {
      app.use(invalidateCacheMiddleware());
      app.post("/api/test", (req, res) => {
        res.json({ created: true });
      });

      mockRedisInstance.scan.mockResolvedValue(["0", ["cache:/api/products/123"]]);
      mockRedisInstance.unlink.mockResolvedValue(1);

      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedisInstance.scan).toHaveBeenCalled();
    });

    it("invalidates cache on PUT", async () => {
      app.use(invalidateCacheMiddleware());
      app.put("/api/test", (req, res) => {
        res.json({ updated: true });
      });

      mockRedisInstance.scan.mockResolvedValue(["0", ["cache:/api/products/456"]]);
      mockRedisInstance.unlink.mockResolvedValue(1);

      const response = await request(app).put("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedisInstance.scan).toHaveBeenCalled();
    });

    it("invalidates cache on DELETE", async () => {
      app.use(invalidateCacheMiddleware());
      app.delete("/api/test", (req, res) => {
        res.json({ deleted: true });
      });

      mockRedisInstance.scan.mockResolvedValue(["0", ["cache:/api/products/789"]]);
      mockRedisInstance.unlink.mockResolvedValue(1);

      const response = await request(app).delete("/api/test");

      expect(response.statusCode).toBe(200);
      expect(mockRedisInstance.scan).toHaveBeenCalled();
    });

    it("does not invalidate cache on error responses", async () => {
      app.use(invalidateCacheMiddleware());
      app.post("/api/test", (req, res) => {
        res.status(400).json({ error: "bad request" });
      });

      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(400);
      expect(mockRedisInstance.scan).not.toHaveBeenCalled();
      expect(mockRedisInstance.unlink).not.toHaveBeenCalled();
    });

    it("handles cache invalidation errors gracefully", async () => {
      app.use(invalidateCacheMiddleware());
      app.post("/api/test", (req, res) => {
        res.json({ created: true });
      });

      mockRedisInstance.scan.mockRejectedValue(new Error("Invalidation error"));

      const response = await request(app).post("/api/test");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ created: true });
    });
  });

  describe("clearAllCache", () => {
    it("flushes the database", async () => {
      mockRedisInstance.flushdb.mockResolvedValue("OK");
      await clearAllCache();
      expect(mockRedisInstance.flushdb).toHaveBeenCalled();
    });

    it("handles flush errors", async () => {
      mockRedisInstance.flushdb.mockRejectedValue(new Error("flush error"));
      await clearAllCache(); // should not throw
    });
  });
});
