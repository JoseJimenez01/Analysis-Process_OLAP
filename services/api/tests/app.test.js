const request = require("supertest");
const app = require("../src/app");

describe("API app", () => {
  it("returns the root health payload", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ service: "api", status: "ok" });
  });

  it("serves the OpenAPI spec", async () => {
    const response = await request(app).get("/api-json");

    expect(response.statusCode).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(response.body.info.title).toBe("PY01 Restaurantes API");
  });
});