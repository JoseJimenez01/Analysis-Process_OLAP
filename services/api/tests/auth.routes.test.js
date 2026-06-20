const express = require("express");
const request = require("supertest");

jest.mock("../src/config/env", () => ({
  jwtSecret: "test-secret"
}));

const mockSign = jest.fn(() => "signed-token");

jest.mock("jsonwebtoken", () => ({
  sign: (...args) => mockSign(...args)
}));

const mockRegisterUser = jest.fn();
const mockLoginUser = jest.fn();

jest.mock("../src/services/auth.service", () =>
  jest.fn().mockImplementation(() => ({
    registerUser: (...args) => mockRegisterUser(...args),
    login: (...args) => mockLoginUser(...args)
  }))
);

const authRoutes = require("../src/routes/auth.routes");

describe("auth routes", () => {
  const app = express();

  app.use(express.json());
  app.use("/api/auth", authRoutes);

  beforeEach(() => {
    mockSign.mockClear();
    mockLoginUser.mockReset();
    mockLoginUser.mockImplementation(({ email, password } = {}) => {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      return Promise.resolve({ email, role: "customer" });
    });
  });

  it("creates a token with default payload", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email and password are required");
    expect(mockSign).not.toHaveBeenCalled();
  });

  it("creates a token with custom payload", async () => {
    // mock successful login
    mockLoginUser.mockResolvedValue({ email: "juan@example.com", role: "admin" });

    const response = await request(app).post("/api/auth/login").send({ email: "juan@example.com", password: "secret" });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe("signed-token");
    expect(mockSign).toHaveBeenCalledWith(
      { sub: "juan@example.com", role: "admin" },
      "test-secret",
      { expiresIn: "1h" }
    );
  });

  it("returns 401 when email does not exist", async () => {
    mockLoginUser.mockImplementation(() => {
      throw new Error("Invalid credentials");
    });

    const response = await request(app).post("/api/auth/login").send({ email: "noone@example.com", password: "x" });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("registers a user and returns a token", async () => {
    mockRegisterUser.mockResolvedValue({
      id: "user-1",
      name: "Juan Pérez",
      email: "juan@example.com",
      role: "admin",
      createdAt: "2026-04-27T00:00:00.000Z"
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Juan Pérez",
        email: "juan@example.com",
        password: "secret123",
        role: "admin"
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.token).toBe("signed-token");
    expect(response.body.user).toEqual({
      id: "user-1",
      name: "Juan Pérez",
      email: "juan@example.com",
      role: "admin",
      createdAt: "2026-04-27T00:00:00.000Z"
    });
    expect(mockRegisterUser).toHaveBeenCalledWith({
      name: "Juan Pérez",
      email: "juan@example.com",
      password: "secret123",
      role: "admin"
    });
    expect(mockSign).toHaveBeenCalledWith(
      { sub: "juan@example.com", role: "admin" },
      "test-secret",
      { expiresIn: "1h" }
    );
  });
});