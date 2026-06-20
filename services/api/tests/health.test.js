const express = require("express");
const request = require("supertest");

jest.mock("../src/config/db", () => ({
  checkPostgres: jest.fn(),
  checkMongo: jest.fn(),
  checkRedis: jest.fn()
}));

const { checkPostgres, checkMongo, checkRedis } = require("../src/config/db");
const healthRoutes = require("../src/routes/health.routes");

describe("health routes", () => {
  const app = express();
  app.use("/api/health", healthRoutes);

  beforeEach(() => jest.clearAllMocks());

  it("returns ok when all services are up", async () => {
    checkPostgres.mockResolvedValue({ status: "up" });
    checkMongo.mockResolvedValue({ status: "up" });
    checkRedis.mockResolvedValue({ status: "up" });

    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.services.postgres.status).toBe("up");
    expect(res.body.services.mongodb.status).toBe("up");
    expect(res.body.services.redis.status).toBe("up");
  });

  it("returns degraded when postgres is down", async () => {
    checkPostgres.mockResolvedValue({ status: "down", error: "Connection refused" });
    checkMongo.mockResolvedValue({ status: "up" });
    checkRedis.mockResolvedValue({ status: "up" });

    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("degraded");
  });

  it("returns degraded when mongo is down", async () => {
    checkPostgres.mockResolvedValue({ status: "up" });
    checkMongo.mockResolvedValue({ status: "down", error: "Timeout" });
    checkRedis.mockResolvedValue({ status: "up" });

    const res = await request(app).get("/api/health");
    expect(res.body.status).toBe("degraded");
  });

  it("returns degraded when redis is down", async () => {
    checkPostgres.mockResolvedValue({ status: "up" });
    checkMongo.mockResolvedValue({ status: "up" });
    checkRedis.mockResolvedValue({ status: "down", error: "Redis down" });

    const res = await request(app).get("/api/health");
    expect(res.body.status).toBe("degraded");
  });

  it("returns degraded when all services are down", async () => {
    checkPostgres.mockResolvedValue({ status: "down" });
    checkMongo.mockResolvedValue({ status: "down" });
    checkRedis.mockResolvedValue({ status: "down" });

    const res = await request(app).get("/api/health");
    expect(res.body.status).toBe("degraded");
  });
});
