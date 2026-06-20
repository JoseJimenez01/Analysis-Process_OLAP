describe("env config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uses default values when no env vars set", () => {
    delete process.env.NODE_ENV;
    delete process.env.API_PORT;
    delete process.env.DB_ENGINE;
    delete process.env.JWT_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.MONGO_URI;
    delete process.env.REDIS_URL;
    delete process.env.ELASTIC_URL;
    delete process.env.SEARCH_SERVICE_URL;

    const env = require("../src/config/env");
    expect(env.nodeEnv).toBe("development");
    expect(env.port).toBe(3000);
    expect(env.dbEngine).toBe("postgres");
    expect(env.jwtSecret).toBe("change_me");
    expect(env.redisUrl).toBe("redis://localhost:6379");
    expect(env.elasticUrl).toBe("http://localhost:9200");
    expect(env.searchServiceUrl).toBe("http://localhost:4000");
  });

  it("reads values from env vars", () => {
    process.env.NODE_ENV = "production";
    process.env.API_PORT = "4000";
    process.env.DB_ENGINE = "mongodb";
    process.env.JWT_SECRET = "secret123";
    process.env.DATABASE_URL = "postgresql://x";
    process.env.MONGO_URI = "mongodb://y";
    process.env.REDIS_URL = "redis://z";
    process.env.ELASTIC_URL = "http://es:9200";
    process.env.SEARCH_SERVICE_URL = "http://search:5000";

    const env = require("../src/config/env");
    expect(env.nodeEnv).toBe("production");
    expect(env.port).toBe(4000);
    expect(env.dbEngine).toBe("mongodb");
    expect(env.jwtSecret).toBe("secret123");
    expect(env.databaseUrl).toBe("postgresql://x");
    expect(env.mongoUri).toBe("mongodb://y");
  });
});
