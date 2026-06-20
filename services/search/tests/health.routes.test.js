const express = require("express");
const request = require("supertest");

const mockCheckElastic = jest.fn();

jest.mock("../src/config/elasticsearch", () => ({
  checkElastic: () => mockCheckElastic()
}));

const healthRoutes = require("../src/routes/health.routes");

describe("search health routes", () => {
  const app = express();

  app.use("/health", healthRoutes);

  beforeEach(() => {
    mockCheckElastic.mockReset();
  });

  it("returns ok when elasticsearch is up", async () => {
    mockCheckElastic.mockResolvedValue({ status: "up" });

    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.services.elasticsearch).toEqual({ status: "up" });
  });

  it("returns degraded when elasticsearch is down", async () => {
    mockCheckElastic.mockResolvedValue({ status: "down", error: "x" });

    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("degraded");
  });
});