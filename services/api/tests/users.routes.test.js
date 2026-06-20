const express = require("express");
const request = require("supertest");

// Mock auth middleware
jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockUserService = {
  listUsers: jest.fn(),
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn()
};

jest.mock("../src/services/user.service", () =>
  jest.fn().mockImplementation(() => mockUserService)
);

const usersRoutes = require("../src/routes/users.routes");

describe("users routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/users", usersRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("lists all users (admin only)", async () => {
      mockUserService.listUsers.mockResolvedValue([
        { id: "1", name: "Admin User", email: "admin@test.com", role: "admin" }
      ]);

      const response = await request(app)
        .get("/api/users")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockUserService.listUsers).toHaveBeenCalled();
    });

    it("forbids non-admin users from listing", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns a user by id (own profile)", async () => {
      mockUserService.getUser.mockResolvedValue({
        id: "user-1",
        name: "Test User",
        email: "test@test.com",
        role: "customer"
      });

      const response = await request(app).get("/api/users/user-1");

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe("user-1");
      expect(mockUserService.getUser).toHaveBeenCalledWith("user-1");
    });

    it("forbids viewing other users' profiles (non-admin)", async () => {
      const response = await request(app)
        .get("/api/users/other-user")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });

    it("returns 404 when user not found", async () => {
      mockUserService.getUser.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/users/nonexistent")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/users", () => {
    it("creates a new user (admin only)", async () => {
      mockUserService.createUser.mockResolvedValue({
        id: "new-user",
        name: "New User",
        email: "new@test.com",
        role: "customer"
      });

      const response = await request(app)
        .post("/api/users")
        .set("x-user-role", "admin")
        .send({ name: "New User", email: "new@test.com", passwordHash: "hash", role: "customer" });

      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBe("new-user");
      expect(mockUserService.createUser).toHaveBeenCalled();
    });

    it("forbids customers from creating users", async () => {
      const response = await request(app)
        .post("/api/users")
        .set("x-user-role", "customer")
        .send({ name: "New", email: "new@test.com", passwordHash: "hash" });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("updates own user profile", async () => {
      mockUserService.updateUser.mockResolvedValue({
        id: "user-1",
        name: "Updated",
        email: "updated@test.com",
        role: "customer"
      });

      const response = await request(app)
        .put("/api/users/user-1")
        .send({ name: "Updated" });

      expect(response.statusCode).toBe(200);
      expect(mockUserService.updateUser).toHaveBeenCalledWith("user-1", { name: "Updated" });
    });

    it("forbids updating other users' profiles (non-admin)", async () => {
      const response = await request(app)
        .put("/api/users/other-user")
        .set("x-user-role", "customer")
        .send({ name: "Updated" });

      expect(response.statusCode).toBe(403);
    });

    it("returns 404 when user not found", async () => {
      mockUserService.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/users/nonexistent")
        .set("x-user-role", "admin")
        .send({ name: "Updated" });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("deletes a user (admin only)", async () => {
      mockUserService.deleteUser.mockResolvedValue({ id: "user-1" });

      const response = await request(app)
        .delete("/api/users/user-1")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith("user-1");
    });

    it("forbids customers from deleting users", async () => {
      const response = await request(app)
        .delete("/api/users/user-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });
  });
});
