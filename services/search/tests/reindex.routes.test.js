const express = require("express");
const request = require("supertest");

const mockReindexService = {
  reindexAll: jest.fn()
};

jest.mock("../src/indexers/reindex.service", () => ({
  reindexAll: (...args) => mockReindexService.reindexAll(...args)
}));

// Set env token for testing
process.env.SEARCH_REINDEX_TOKEN = "test-token";

const reindexRoutes = require("../src/routes/reindex.routes");

describe("reindex routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/search/reindex", reindexRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SEARCH_REINDEX_TOKEN = "test-token";
  });

  it("rejects request without authentication token", async () => {
    const response = await request(app).post("/search/reindex");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("accepts request with bearer token", async () => {
    mockReindexService.reindexAll.mockResolvedValue({
      success: true,
      restaurantsIndexed: 5,
      productsIndexed: 20
    });

    const response = await request(app)
      .post("/search/reindex")
      .set("Authorization", "Bearer test-token");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.restaurantsIndexed).toBe(5);
    expect(response.body.productsIndexed).toBe(20);
    expect(mockReindexService.reindexAll).toHaveBeenCalled();
  });

  it("accepts request with x-api-key header", async () => {
    mockReindexService.reindexAll.mockResolvedValue({
      success: true,
      restaurantsIndexed: 3,
      productsIndexed: 15
    });

    const response = await request(app)
      .post("/search/reindex")
      .set("X-API-Key", "test-token");

    expect(response.statusCode).toBe(200);
    expect(mockReindexService.reindexAll).toHaveBeenCalled();
  });

  it("rejects request with wrong bearer token", async () => {
    const response = await request(app)
      .post("/search/reindex")
      .set("Authorization", "Bearer wrong-token");

    expect(response.statusCode).toBe(401);
    expect(mockReindexService.reindexAll).not.toHaveBeenCalled();
  });

  it("rejects request with wrong api key", async () => {
    const response = await request(app)
      .post("/search/reindex")
      .set("X-API-Key", "wrong-key");

    expect(response.statusCode).toBe(401);
    expect(mockReindexService.reindexAll).not.toHaveBeenCalled();
  });

  it("returns 500 when reindex token not configured", async () => {
    delete process.env.SEARCH_REINDEX_TOKEN;

    const response = await request(app)
      .post("/search/reindex")
      .set("Authorization", "Bearer any-token");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Reindex token not configured");
  });

  it("returns 500 when reindex service fails", async () => {
    mockReindexService.reindexAll.mockRejectedValue(new Error("Database connection failed"));

    const response = await request(app)
      .post("/search/reindex")
      .set("Authorization", "Bearer test-token");

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe("Reindex failed");
    expect(response.body.error).toBe("Database connection failed");
  });

  it("handles partial reindex (some data indexed)", async () => {
    mockReindexService.reindexAll.mockResolvedValue({
      success: true,
      restaurantsIndexed: 0,
      productsIndexed: 10
    });

    const response = await request(app)
      .post("/search/reindex")
      .set("Authorization", "Bearer test-token");

    expect(response.statusCode).toBe(200);
    expect(response.body.restaurantsIndexed).toBe(0);
    expect(response.body.productsIndexed).toBe(10);
  });
});
