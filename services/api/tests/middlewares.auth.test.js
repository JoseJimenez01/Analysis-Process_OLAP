const express = require("express");
const request = require("supertest");

jest.mock("../src/config/env", () => ({
  jwtSecret: "test-secret"
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn()
}));

const jwt = require("jsonwebtoken");
const auth = require("../src/middlewares/auth");

describe("auth middleware", () => {
  const app = express();

  app.get("/private", auth, (req, res) => {
    res.status(200).json({ user: req.user });
  });

  it("rejects requests without token", async () => {
    const response = await request(app).get("/private");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Token is required");
  });

  it("rejects invalid tokens", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    const response = await request(app)
      .get("/private")
      .set("Authorization", "Bearer bad-token");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });

  it("attaches decoded user on valid token", async () => {
    jwt.verify.mockReturnValue({ sub: "juan@example.com" });

    const response = await request(app)
      .get("/private")
      .set("Authorization", "Bearer good-token");

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toEqual({ sub: "juan@example.com" });
  });
});