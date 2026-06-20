const request = require("supertest");
const app = require("../src/app");

describe("Search app", () => {
  it("returns the root health payload", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ service: "search", status: "ok" });
  });
});