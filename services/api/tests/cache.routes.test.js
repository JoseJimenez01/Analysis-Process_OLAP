const express = require("express");
const request = require("supertest");

const mockRedis = {
  status: "ready",
  connect: jest.fn(),
  info: jest.fn()
};

jest.mock("../src/config/db", () => ({
  redis: mockRedis
}));

const cacheRoutes = require("../src/routes/cache.routes");

describe("cache routes", () => {
  const app = express();

  app.use("/api/cache", cacheRoutes);

  beforeEach(() => {
    mockRedis.status = "ready";
    mockRedis.connect.mockReset();
    mockRedis.info.mockReset();
  });

  it("returns redis stats when ready", async () => {
    mockRedis.info.mockResolvedValue("used_memory:1000");

    const response = await request(app).get("/api/cache/stats");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "ok", info: "used_memory:1000" });
    expect(mockRedis.connect).not.toHaveBeenCalled();
  });

  it("connects before reading stats when not ready", async () => {
    mockRedis.status = "wait";
    mockRedis.info.mockResolvedValue("stats");

    const response = await request(app).get("/api/cache/stats");

    expect(response.statusCode).toBe(200);
    expect(mockRedis.connect).toHaveBeenCalledTimes(1);
    expect(mockRedis.info).toHaveBeenCalledWith("stats");
  });

  it("returns down when redis fails", async () => {
    mockRedis.info.mockRejectedValue(new Error("boom"));

    const response = await request(app).get("/api/cache/stats");

    expect(response.statusCode).toBe(503);
    expect(response.body.status).toBe("down");
    expect(response.body.error).toBe("boom");
  });
});