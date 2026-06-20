const { redis } = require("../../src/middlewares/cache.middleware");

describe("Redis Cache Integration", () => {
  jest.setTimeout(30000);

  it("should connect to Redis and set/get a value", async () => {
    const key = "test:integration:key";
    const value = "hello_world";
    
    await redis.set(key, value, "EX", 10);
    const retrieved = await redis.get(key);
    
    expect(retrieved).toBe(value);
    
    await redis.del(key);
  });

  afterAll(async () => {
    await redis.quit();
  });
});
