const express = require("express");
const request = require("supertest");

const mockElastic = {
  search: jest.fn()
};

jest.mock("../src/config/elasticsearch", () => ({
  elastic: mockElastic
}));

const searchRoutes = require("../src/routes/search.routes");

describe("search routes", () => {
  const app = express();

  app.use("/search", searchRoutes);

  beforeEach(() => {
    mockElastic.search.mockReset();
  });

  it("rejects empty queries", async () => {
    const response = await request(app).get("/search");

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Query parameter 'q' is required");
  });

  it("returns search results", async () => {
    mockElastic.search.mockResolvedValue({
      hits: {
        hits: [{ _source: { id: "1", name: "La Trattoria" } }]
      }
    });

    const response = await request(app).get("/search?q=trattoria");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([{ id: "1", name: "La Trattoria" }]);
  });

  it("returns down when elasticsearch fails", async () => {
    mockElastic.search.mockRejectedValue(new Error("down"));

    const response = await request(app).get("/search?q=trattoria");

    expect(response.statusCode).toBe(503);
    expect(response.body.message).toBe("Search service unavailable");
  });
});