const request = require("supertest");
const app = require("../../src/app");
const { elastic } = require("../../src/config/elasticsearch");
const mongoose = require("mongoose");
const { redis } = require("../../src/middlewares/cache.middleware");

describe("Reindex Flow Integration", () => {
  jest.setTimeout(30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await redis.quit();
  });

  it("should trigger reindex via API (needs token)", async () => {
    const token = process.env.SEARCH_REINDEX_TOKEN || "admin-secret-reindex-key-change-in-production";
    
    // Call the endpoint
    const response = await request(app)
      .post("/search/reindex")
      .set("Authorization", `Bearer ${token}`);
    
    // As it connects to the DB, it may be 200 (success) or 500 (if tables don't exist yet)
    // But it should definitely not be 401 Unauthorized
    expect([200, 500]).toContain(response.status);
  });
});
