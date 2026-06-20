const express = require("express");
const request = require("supertest");

jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockCategoryService = {
  listCategories: jest.fn(),
  getCategory: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn()
};

jest.mock("../src/services/category.service", () =>
  jest.fn().mockImplementation(() => mockCategoryService)
);

const categoriesRoutes = require("../src/routes/categories.routes");

describe("categories routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/categories", categoriesRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/categories", () => {
    it("lists all categories", async () => {
      mockCategoryService.listCategories.mockResolvedValue([
        { id: "1", name: "Appetizers", description: "Starters" }
      ]);

      const response = await request(app).get("/api/categories");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Appetizers");
    });
  });

  describe("GET /api/categories/:id", () => {
    it("returns a category by id", async () => {
      mockCategoryService.getCategory.mockResolvedValue({
        id: "cat-1",
        name: "Desserts",
        description: "Sweet treats"
      });

      const response = await request(app).get("/api/categories/cat-1");

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe("cat-1");
    });

    it("returns 404 when category not found", async () => {
      mockCategoryService.getCategory.mockResolvedValue(null);

      const response = await request(app).get("/api/categories/nonexistent");

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/categories", () => {
    it("creates a category (admin only)", async () => {
      mockCategoryService.createCategory.mockResolvedValue({
        id: "new-cat",
        name: "Beverages",
        description: "Drinks"
      });

      const response = await request(app)
        .post("/api/categories")
        .set("x-user-role", "admin")
        .send({ name: "Beverages", description: "Drinks" });

      expect(response.statusCode).toBe(201);
      expect(mockCategoryService.createCategory).toHaveBeenCalled();
    });

    it("forbids non-admin from creating", async () => {
      const response = await request(app)
        .post("/api/categories")
        .set("x-user-role", "customer")
        .send({ name: "Beverages" });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("updates a category (admin only)", async () => {
      mockCategoryService.updateCategory.mockResolvedValue({
        id: "cat-1",
        name: "Updated",
        description: "Updated desc"
      });

      const response = await request(app)
        .put("/api/categories/cat-1")
        .set("x-user-role", "admin")
        .send({ name: "Updated" });

      expect(response.statusCode).toBe(200);
    });

    it("returns 404 on update of nonexistent category", async () => {
      mockCategoryService.updateCategory.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/categories/nonexistent")
        .set("x-user-role", "admin")
        .send({ name: "Updated" });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("deletes a category (admin only)", async () => {
      mockCategoryService.deleteCategory.mockResolvedValue({ id: "cat-1" });

      const response = await request(app)
        .delete("/api/categories/cat-1")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
    });

    it("forbids non-admin from deleting", async () => {
      const response = await request(app)
        .delete("/api/categories/cat-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });
  });
});
