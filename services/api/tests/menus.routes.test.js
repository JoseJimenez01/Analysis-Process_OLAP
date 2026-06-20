const express = require("express");
const request = require("supertest");

jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockMenuService = {
  listMenus: jest.fn(),
  getMenu: jest.fn(),
  createMenu: jest.fn(),
  updateMenu: jest.fn(),
  deleteMenu: jest.fn()
};

jest.mock("../src/services/menu.service", () =>
  jest.fn().mockImplementation(() => mockMenuService)
);

const menusRoutes = require("../src/routes/menus.routes");

describe("menus routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/menus", menusRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/menus", () => {
    it("lists all menus", async () => {
      mockMenuService.listMenus.mockResolvedValue([
        { id: "1", name: "Lunch Menu", restaurantId: "rest-1", active: true }
      ]);

      const response = await request(app).get("/api/menus");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe("GET /api/menus/:id", () => {
    it("returns a menu by id", async () => {
      mockMenuService.getMenu.mockResolvedValue({
        id: "menu-1",
        name: "Dinner Menu",
        restaurantId: "rest-1",
        active: true
      });

      const response = await request(app).get("/api/menus/menu-1");

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe("menu-1");
    });

    it("returns 404 when menu not found", async () => {
      mockMenuService.getMenu.mockResolvedValue(null);

      const response = await request(app).get("/api/menus/nonexistent");

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/menus", () => {
    it("creates a menu (admin only)", async () => {
      mockMenuService.createMenu.mockResolvedValue({
        id: "new-menu",
        name: "Special Menu",
        restaurantId: "rest-1"
      });

      const response = await request(app)
        .post("/api/menus")
        .set("x-user-role", "admin")
        .send({ name: "Special Menu", restaurantId: "rest-1" });

      expect(response.statusCode).toBe(201);
    });

    it("forbids non-admin from creating", async () => {
      const response = await request(app)
        .post("/api/menus")
        .set("x-user-role", "customer")
        .send({ name: "Menu" });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PUT /api/menus/:id", () => {
    it("updates a menu (admin only)", async () => {
      mockMenuService.updateMenu.mockResolvedValue({
        id: "menu-1",
        name: "Updated Menu",
        active: false
      });

      const response = await request(app)
        .put("/api/menus/menu-1")
        .set("x-user-role", "admin")
        .send({ active: false });

      expect(response.statusCode).toBe(200);
    });

    it("returns 404 on update of nonexistent", async () => {
      mockMenuService.updateMenu.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/menus/nonexistent")
        .set("x-user-role", "admin")
        .send({ active: false });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/menus/:id", () => {
    it("deletes a menu (admin only)", async () => {
      mockMenuService.deleteMenu.mockResolvedValue({ id: "menu-1" });

      const response = await request(app)
        .delete("/api/menus/menu-1")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
    });

    it("forbids non-admin from deleting", async () => {
      const response = await request(app)
        .delete("/api/menus/menu-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });
  });
});
