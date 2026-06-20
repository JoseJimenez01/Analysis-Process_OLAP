const request = require("supertest");
const app = require("../../src/app");
const { getPrismaClient, mongoose, checkPostgres } = require("../../src/config/db");
const { redis } = require("../../src/middlewares/cache.middleware");

describe("Product Flow Integration", () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Wait for DB to be ready
    let retries = 5;
    while (retries > 0) {
      const status = await checkPostgres();
      if (status.status === "up") break;
      await new Promise(r => setTimeout(r, 2000));
      retries--;
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.$disconnect();
    }
    await redis.quit();
  });

  it("should return a list of products", async () => {
    const response = await request(app).get("/api/products");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
