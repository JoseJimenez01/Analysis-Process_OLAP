describe("search env config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses default values when no env vars set", () => {
    delete process.env.SEARCH_PORT;
    delete process.env.NODE_ENV;
    delete process.env.DB_ENGINE;
    delete process.env.ELASTIC_URL;
    delete process.env.REDIS_URL;
    delete process.env.MONGO_URI;

    const env = require("../src/config/env");
    expect(env.port).toBe(4000);
    expect(env.nodeEnv).toBe("development");
    expect(env.dbEngine).toBe("postgres");
    expect(env.elasticUrl).toBe("http://localhost:9200");
    expect(env.redisUrl).toBe("redis://localhost:6379");
    expect(env.mongoUri).toBe("");
  });

  it("reads values from env vars", () => {
    process.env.SEARCH_PORT = "5000";
    process.env.NODE_ENV = "test";
    process.env.DB_ENGINE = "mongodb";
    process.env.ELASTIC_URL = "http://es:9200";
    process.env.REDIS_URL = "redis://r:6379";
    process.env.MONGO_URI = "mongodb://m:27017/db";

    const env = require("../src/config/env");
    expect(env.port).toBe(5000);
    expect(env.nodeEnv).toBe("test");
    expect(env.dbEngine).toBe("mongodb");
    expect(env.elasticUrl).toBe("http://es:9200");
    expect(env.mongoUri).toBe("mongodb://m:27017/db");
  });
});
