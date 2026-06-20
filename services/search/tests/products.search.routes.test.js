const express = require("express");
const request = require("supertest");

const mockElastic = {
  search: jest.fn()
};

jest.mock("../src/config/elasticsearch", () => ({
  elastic: mockElastic
}));

const productsSearchRoutes = require("../src/routes/products.search.routes");

describe("products search routes", () => {
  const app = express();
  app.use("/search/products", productsSearchRoutes);

  beforeEach(() => {
    mockElastic.search.mockReset();
  });

  describe("GET /search/products", () => {
    it("rejects empty queries", async () => {
      const response = await request(app).get("/search/products");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Query parameter 'q' is required");
    });

    it("returns product search results", async () => {
      mockElastic.search.mockResolvedValue({
        hits: {
          hits: [
            { _source: { id: "1", name: "Pasta Carbonara", price: 12.99, categoryId: "cat-1" } },
            { _source: { id: "2", name: "Pasta Bolognese", price: 13.99, categoryId: "cat-1" } }
          ]
        }
      });

      const response = await request(app).get("/search/products?q=pasta");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe("Pasta Carbonara");
      expect(mockElastic.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: "products",
          query: expect.objectContaining({
            multi_match: expect.any(Object)
          })
        })
      );
    });

    it("filters results by category when provided", async () => {
      mockElastic.search.mockResolvedValue({
        hits: {
          hits: [{ _source: { id: "1", name: "Tiramisu", price: 7.99, categoryId: "cat-dessert" } }]
        }
      });

      const response = await request(app).get("/search/products?q=tiramisu&category=cat-dessert");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockElastic.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: "products",
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.objectContaining({
                term: { categoryId: "cat-dessert" }
              })
            })
          })
        })
      );
    });

    it("returns empty array when no results", async () => {
      mockElastic.search.mockResolvedValue({
        hits: {
          hits: []
        }
      });

      const response = await request(app).get("/search/products?q=nonexistent");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("returns 503 when elasticsearch fails", async () => {
      mockElastic.search.mockRejectedValue(new Error("Connection refused"));

      const response = await request(app).get("/search/products?q=pasta");

      expect(response.statusCode).toBe(503);
      expect(response.body.message).toBe("Search service unavailable");
    });
  });

  describe("GET /search/products/category/:categoryId", () => {
    it("returns products filtered by category", async () => {
      mockElastic.search.mockResolvedValue({
        hits: {
          hits: [
            { _source: { id: "1", name: "Pizza Margherita", price: 12.99, categoryId: "cat-pizza" } },
            { _source: { id: "2", name: "Pizza Pepperoni", price: 13.99, categoryId: "cat-pizza" } }
          ]
        }
      });

      const response = await request(app).get("/search/products/category/cat-pizza");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(mockElastic.search).toHaveBeenCalledWith({
        index: "products",
        query: {
          term: {
            categoryId: "cat-pizza"
          }
        }
      });
    });

    it("returns empty array when no products in category", async () => {
      mockElastic.search.mockResolvedValue({
        hits: {
          hits: []
        }
      });

      const response = await request(app).get("/search/products/category/cat-empty");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("rejects missing categoryId", async () => {
      const response = await request(app).get("/search/products/category/");

      expect(response.statusCode).toBe(404);
    });

    it("returns 503 when elasticsearch fails", async () => {
      mockElastic.search.mockRejectedValue(new Error("Connection refused"));

      const response = await request(app).get("/search/products/category/cat-pizza");

      expect(response.statusCode).toBe(503);
      expect(response.body.message).toBe("Search service unavailable");
    });

    it("rejects whitespace-only categoryId", async () => {
      mockElastic.search.mockResolvedValue({
        hits: { hits: [] }
      });

      const response = await request(app).get("/search/products/category/%20%20");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Category ID is required");
    });
  });
});
