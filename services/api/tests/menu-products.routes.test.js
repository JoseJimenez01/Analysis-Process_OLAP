const express = require("express");
const request = require("supertest");

jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockMenuProductService = {
  listProductsByMenu: jest.fn(),
  getMenuProduct: jest.fn(),
  addProductToMenu: jest.fn(),
  removeProductFromMenu: jest.fn(),
  removeProductByMenuAndId: jest.fn()
};

jest.mock("../src/services/menu-product.service", () =>
  jest.fn().mockImplementation(() => mockMenuProductService)
);

const menuProductsRoutes = require("../src/routes/menu-products.routes");

describe("menu-products routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/menus", menuProductsRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/menus/:menuId/products", () => {
    it("lists products in a menu", async () => {
      mockMenuProductService.listProductsByMenu.mockResolvedValue([
        { id: "mp-1", menuId: "menu-1", productId: "prod-1", displayOrder: 1 }
      ]);

      const response = await request(app).get("/api/menus/menu-1/products");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockMenuProductService.listProductsByMenu).toHaveBeenCalledWith("menu-1");
    });

    it("returns empty array when menu has no products", async () => {
      mockMenuProductService.listProductsByMenu.mockResolvedValue([]);

      const response = await request(app).get("/api/menus/menu-1/products");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("POST /api/menus/:menuId/products", () => {
    it("adds a product to menu (admin only)", async () => {
      mockMenuProductService.addProductToMenu.mockResolvedValue({
        id: "mp-new",
        menuId: "menu-1",
        productId: "prod-1",
        displayOrder: 0
      });

      const response = await request(app)
        .post("/api/menus/menu-1/products")
        .set("x-user-role", "admin")
        .send({ productId: "prod-1", displayOrder: 0 });

      expect(response.statusCode).toBe(201);
      expect(mockMenuProductService.addProductToMenu).toHaveBeenCalledWith({
        menuId: "menu-1",
        productId: "prod-1",
        displayOrder: 0
      });
    });

    it("forbids non-admin from adding products", async () => {
      const response = await request(app)
        .post("/api/menus/menu-1/products")
        .set("x-user-role", "customer")
        .send({ productId: "prod-1" });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/menus/:menuId/products/:productId", () => {
    it("removes a product from menu (admin only)", async () => {
      mockMenuProductService.removeProductByMenuAndId.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .delete("/api/menus/menu-1/products/prod-1")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
      expect(mockMenuProductService.removeProductByMenuAndId).toHaveBeenCalledWith("menu-1", "prod-1");
    });

    it("returns 404 when product not in menu", async () => {
      mockMenuProductService.removeProductByMenuAndId.mockResolvedValue({ count: 0 });

      const response = await request(app)
        .delete("/api/menus/menu-1/products/prod-1")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(404);
    });

    it("forbids non-admin from removing products", async () => {
      const response = await request(app)
        .delete("/api/menus/menu-1/products/prod-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });
  });
});
