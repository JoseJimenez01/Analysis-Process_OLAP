const express = require("express");
const request = require("supertest");

jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockRestaurantService = {
  listRestaurants: jest.fn(),
  getRestaurant: jest.fn(),
  createRestaurant: jest.fn(),
  updateRestaurant: jest.fn(),
  deleteRestaurant: jest.fn()
};

jest.mock("../src/services/restaurant.service", () =>
  jest.fn().mockImplementation(() => mockRestaurantService)
);

const restaurantRoutes = require("../src/routes/restaurants.routes");

describe("restaurants routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/restaurants", restaurantRoutes);

  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/restaurants", () => {
    it("lists all restaurants", async () => {
      mockRestaurantService.listRestaurants.mockResolvedValue([
        { id: "1", name: "Test Restaurant" }
      ]);
      const res = await request(app).get("/api/restaurants");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("returns 500 on service error", async () => {
      mockRestaurantService.listRestaurants.mockRejectedValue(new Error("DB error"));
      const res = await request(app).get("/api/restaurants");
      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /api/restaurants/:id", () => {
    it("returns a restaurant by id", async () => {
      mockRestaurantService.getRestaurant.mockResolvedValue({ id: "r1", name: "Res" });
      const res = await request(app).get("/api/restaurants/r1");
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe("r1");
    });

    it("returns 404 when not found", async () => {
      mockRestaurantService.getRestaurant.mockResolvedValue(null);
      const res = await request(app).get("/api/restaurants/nope");
      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /api/restaurants", () => {
    it("creates a restaurant (admin)", async () => {
      mockRestaurantService.createRestaurant.mockResolvedValue({ id: "new", name: "New" });
      const res = await request(app)
        .post("/api/restaurants")
        .set("x-user-role", "admin")
        .send({ name: "New", address: "123 St", phone: "555", description: "Nice" });
      expect(res.statusCode).toBe(201);
    });

    it("forbids non-admin", async () => {
      const res = await request(app)
        .post("/api/restaurants")
        .set("x-user-role", "customer")
        .send({ name: "New" });
      expect(res.statusCode).toBe(403);
    });
  });

  describe("PUT /api/restaurants/:id", () => {
    it("updates a restaurant (admin)", async () => {
      mockRestaurantService.updateRestaurant.mockResolvedValue({ id: "r1", name: "Updated" });
      const res = await request(app)
        .put("/api/restaurants/r1")
        .set("x-user-role", "admin")
        .send({ name: "Updated" });
      expect(res.statusCode).toBe(200);
    });

    it("returns 404 if not found", async () => {
      mockRestaurantService.updateRestaurant.mockResolvedValue(null);
      const res = await request(app)
        .put("/api/restaurants/nope")
        .set("x-user-role", "admin")
        .send({ name: "X" });
      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/restaurants/:id", () => {
    it("deletes a restaurant (admin)", async () => {
      mockRestaurantService.deleteRestaurant.mockResolvedValue({ id: "r1" });
      const res = await request(app)
        .delete("/api/restaurants/r1")
        .set("x-user-role", "admin");
      expect(res.statusCode).toBe(200);
    });

    it("forbids non-admin", async () => {
      const res = await request(app)
        .delete("/api/restaurants/r1")
        .set("x-user-role", "customer");
      expect(res.statusCode).toBe(403);
    });
  });
});
