const express = require("express");
const request = require("supertest");

const mockSearch = jest.fn();

jest.mock("@elastic/elasticsearch", () => ({
  Client: jest.fn().mockImplementation(() => ({
    search: mockSearch
  }))
}));

jest.mock("../src/config/env", () => ({
  elasticUrl: "http://localhost:9200",
  redisUrl: "redis://localhost:6379",
  nodeEnv: "test"
}));

const advancedSearchRoutes = require("../src/routes/advanced-search.routes");

describe("advanced search routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/search/advanced", advancedSearchRoutes);

  beforeEach(() => jest.clearAllMocks());

  describe("GET /search/advanced/advanced", () => {
    it("returns 400 when no query or filter provided", async () => {
      const res = await request(app).get("/search/advanced/advanced");
      expect(res.statusCode).toBe(400);
    });

    it("searches with text query", async () => {
      mockSearch.mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [{ _source: { name: "Pizza" }, _score: 1.5 }]
        },
        aggregations: {}
      });

      const res = await request(app).get("/search/advanced/advanced?q=pizza");
      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.results[0].name).toBe("Pizza");
    });

    it("searches with filters only", async () => {
      mockSearch.mockResolvedValue({
        hits: {
          total: { value: 2 },
          hits: [
            { _source: { name: "A" }, _score: null },
            { _source: { name: "B" }, _score: null }
          ]
        },
        aggregations: {}
      });

      const res = await request(app).get("/search/advanced/advanced?categoryId=cat1&minPrice=10&maxPrice=50");
      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it("supports sort by price_asc", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&sortBy=price_asc");
      expect(res.statusCode).toBe(200);
    });

    it("supports sort by price_desc", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&sortBy=price_desc");
      expect(res.statusCode).toBe(200);
    });

    it("supports sort by rating", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&sortBy=rating");
      expect(res.statusCode).toBe(200);
    });

    it("supports sort by newest", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&sortBy=newest");
      expect(res.statusCode).toBe(200);
    });

    it("supports available filter", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&available=true");
      expect(res.statusCode).toBe(200);
    });

    it("supports minRating filter", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&minRating=4");
      expect(res.statusCode).toBe(200);
    });

    it("supports restaurantId filter", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&restaurantId=r1");
      expect(res.statusCode).toBe(200);
    });

    it("handles pagination", async () => {
      mockSearch.mockResolvedValue({
        hits: { total: { value: 50 }, hits: [] }, aggregations: {}
      });
      const res = await request(app).get("/search/advanced/advanced?q=test&page=2&limit=10");
      expect(res.statusCode).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(10);
    });

    it("returns 503 on ES error", async () => {
      mockSearch.mockRejectedValue(new Error("ES down"));
      const res = await request(app).get("/search/advanced/advanced?q=test");
      expect(res.statusCode).toBe(503);
    });
  });

  describe("GET /search/advanced/autocomplete", () => {
    it("returns 400 when query too short", async () => {
      const res = await request(app).get("/search/advanced/autocomplete?q=a");
      expect(res.statusCode).toBe(400);
    });

    it("returns 400 when no query", async () => {
      const res = await request(app).get("/search/advanced/autocomplete");
      expect(res.statusCode).toBe(400);
    });

    it("returns suggestions", async () => {
      mockSearch.mockResolvedValue({
        hits: {
          hits: [
            { _source: { name: "Pizza Margherita", productId: "1" } },
            { _source: { name: "Pizza Pepperoni", productId: "2" } }
          ]
        }
      });

      const res = await request(app).get("/search/advanced/autocomplete?q=piz");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("removes duplicate suggestions", async () => {
      mockSearch.mockResolvedValue({
        hits: {
          hits: [
            { _source: { name: "Pizza", productId: "1" } },
            { _source: { name: "Pizza", productId: "2" } }
          ]
        }
      });

      const res = await request(app).get("/search/advanced/autocomplete?q=piz");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("returns 503 on ES error", async () => {
      mockSearch.mockRejectedValue(new Error("ES down"));
      const res = await request(app).get("/search/advanced/autocomplete?q=test");
      expect(res.statusCode).toBe(503);
    });
  });
});
