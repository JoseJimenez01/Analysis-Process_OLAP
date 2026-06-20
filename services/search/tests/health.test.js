const request = require("supertest");
const app = require("../src/app");

describe("GET /", () => {
  it("should return Search service status", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.service).toBe("search");
  });
});
