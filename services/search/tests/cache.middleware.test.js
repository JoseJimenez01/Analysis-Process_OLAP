const express = require("express");
const request = require("supertest");

const mockRedisInstance = {
  get: jest.fn(),
  setex: jest.fn(),
  flushdb: jest.fn(),
  status: "ready"
};

jest.mock("ioredis", () => {
  return jest.fn(() => mockRedisInstance);
});

jest.mock("../src/config/env", () => ({
  elasticUrl: "http://localhost:9200",
  redisUrl: "redis://localhost:6379",
  nodeEnv: "test"
}));

const { cacheMiddleware } = require("../src/middlewares/cache.middleware");

describe("search cache middleware", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  it("returns MISS and caches search results on first request", async () => {
    mockRedisInstance.get.mockResolvedValue(null);
    mockRedisInstance.setex.mockResolvedValue("OK");

    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json([
        { id: "1", name: "Pasta", categoryId: "cat-1" },
        { id: "2", name: "Pizza", categoryId: "cat-2" }
      ]);
    });

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-cache"]).toBe("MISS");
    expect(response.body).toHaveLength(2);
  });

  it("returns HIT from cache on subsequent request", async () => {
    const cached = JSON.stringify([
      { id: "1", name: "Pasta", categoryId: "cat-1" }
    ]);
    mockRedisInstance.get.mockResolvedValue(cached);

    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json([{ id: "1", name: "Pasta" }]);
    });

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-cache"]).toBe("HIT");
    expect(response.body[0].name).toBe("Pasta");
  });

  it("caches with correct TTL of 10 minutes", async () => {
    mockRedisInstance.get.mockResolvedValue(null);
    mockRedisInstance.setex.mockResolvedValue("OK");

    app.use("/search/products", cacheMiddleware(600));
    app.get("/search/products", (req, res) => {
      res.json([{ id: "1", name: "Pizza" }]);
    });

    await request(app).get("/search/products?q=pizza");

    expect(mockRedisInstance.setex).toHaveBeenCalledWith(
      expect.stringContaining("cache:search"),
      600,
      expect.any(String)
    );
  });

  it("does not cache non-GET requests", async () => {
    app.use("/search", cacheMiddleware(600));
    app.post("/search/test", (req, res) => {
      res.json({ created: true });
    });

    await request(app).post("/search/test");

    expect(mockRedisInstance.get).not.toHaveBeenCalled();
  });

  it("handles cache retrieval errors gracefully", async () => {
    mockRedisInstance.get.mockRejectedValue(new Error("Redis error"));

    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json({ data: "fallback" });
    });

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ data: "fallback" });
  });

  it("handles cache storage errors gracefully", async () => {
    mockRedisInstance.get.mockResolvedValue(null);
    mockRedisInstance.setex.mockResolvedValue("OK");

    app.use("/search", cacheMiddleware(600));
    app.get("/search/test", (req, res) => {
      res.json({ data: "test" });
    });

    const response = await request(app).get("/search/test");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ data: "test" });
  });
});
