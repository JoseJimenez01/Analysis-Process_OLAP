const express = require("express");
const request = require("supertest");

jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockProductService = {
  listProducts: jest.fn(),
  getProduct: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn()
};

jest.mock("../src/services/product.service", () =>
  jest.fn().mockImplementation(() => mockProductService)
);

const productsRoutes = require("../src/routes/products.routes");

describe("products routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/products", productsRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("lists all products", async () => {
      mockProductService.listProducts.mockResolvedValue([
        { id: "1", name: "Pasta", price: 12.99, categoryId: "cat-1" }
      ]);

      const response = await request(app).get("/api/products");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe("GET /api/products/:id", () => {
    it("returns a product by id", async () => {
      mockProductService.getProduct.mockResolvedValue({
        id: "prod-1",
        name: "Pizza",
        price: 15.99,
        categoryId: "cat-1"
      });

      const response = await request(app).get("/api/products/prod-1");

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe("prod-1");
    });

    it("returns 404 when product not found", async () => {
      mockProductService.getProduct.mockResolvedValue(null);

      const response = await request(app).get("/api/products/nonexistent");

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/products", () => {
    it("creates a product (admin only)", async () => {
      mockProductService.createProduct.mockResolvedValue({
        id: "new-prod",
        name: "Risotto",
        price: 14.99,
        categoryId: "cat-1"
      });

      const response = await request(app)
        .post("/api/products")
        .set("x-user-role", "admin")
        .send({ name: "Risotto", price: 14.99, categoryId: "cat-1" });

      expect(response.statusCode).toBe(201);
    });

    it("forbids non-admin from creating", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("x-user-role", "customer")
        .send({ name: "Risotto", price: 14.99 });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("updates a product (admin only)", async () => {
      mockProductService.updateProduct.mockResolvedValue({
        id: "prod-1",
        name: "Updated Pizza",
        price: 16.99
      });

      const response = await request(app)
        .put("/api/products/prod-1")
        .set("x-user-role", "admin")
        .send({ price: 16.99 });

      expect(response.statusCode).toBe(200);
    });

    it("returns 404 on update of nonexistent", async () => {
      mockProductService.updateProduct.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/products/nonexistent")
        .set("x-user-role", "admin")
        .send({ price: 20 });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("deletes a product (admin only)", async () => {
      mockProductService.deleteProduct.mockResolvedValue({ id: "prod-1" });

      const response = await request(app)
        .delete("/api/products/prod-1")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
    });

    it("forbids non-admin from deleting", async () => {
      const response = await request(app)
        .delete("/api/products/prod-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });
  });
});
