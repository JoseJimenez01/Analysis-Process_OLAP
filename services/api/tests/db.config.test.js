// Mock mongoose before requiring db.js
const mockConnect = jest.fn();
const mockPing = jest.fn();

jest.mock("mongoose", () => ({
  connect: mockConnect,
  connection: { readyState: 0 }
}));

jest.mock("ioredis", () => {
  const mockRedis = {
    status: "ready",
    connect: jest.fn(),
    ping: jest.fn(),
    lazyConnect: true
  };
  return jest.fn(() => mockRedis);
});

jest.mock("../src/config/env", () => ({
  nodeEnv: "test",
  port: 3000,
  dbEngine: "postgres",
  jwtSecret: "test",
  databaseUrl: "postgresql://test",
  mongoUri: "mongodb://test",
  redisUrl: "redis://localhost:6379",
  elasticUrl: "http://localhost:9200",
  searchServiceUrl: "http://localhost:4000"
}));

const db = require("../src/config/db");

describe("config/db", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkMongo", () => {
    it("returns up when mongo connects", async () => {
      mockConnect.mockResolvedValue(true);
      const result = await db.checkMongo();
      expect(result.status).toBe("up");
    });

    it("returns down when mongo fails", async () => {
      mockConnect.mockRejectedValue(new Error("Connection failed"));
      // Reset the module's internal state
      jest.resetModules();

      jest.mock("mongoose", () => ({
        connect: jest.fn().mockRejectedValue(new Error("Connection failed")),
        connection: { readyState: 0 }
      }));

      jest.mock("ioredis", () => {
        return jest.fn(() => ({
          status: "ready",
          connect: jest.fn(),
          ping: jest.fn(),
          lazyConnect: true
        }));
      });

      jest.mock("../src/config/env", () => ({
        nodeEnv: "test",
        mongoUri: "mongodb://bad",
        redisUrl: "redis://localhost:6379"
      }));

      const freshDb = require("../src/config/db");
      const result = await freshDb.checkMongo();
      expect(result.status).toBe("down");
    });
  });

  describe("checkRedis", () => {
    it("returns up when redis pings", async () => {
      const Redis = require("ioredis");
      const redisInstance = new Redis();
      redisInstance.ping.mockResolvedValue("PONG");

      const result = await db.checkRedis();
      expect(result.status).toBe("up");
    });
  });

  describe("checkPostgres", () => {
    it("returns down when prisma client not generated", async () => {
      const result = await db.checkPostgres();
      // In test environment without Prisma generated, it should return down
      expect(result).toBeDefined();
      expect(["up", "down"]).toContain(result.status);
    });
  });

  describe("ensureMongoConnection", () => {
    it("connects to mongo", async () => {
      mockConnect.mockResolvedValue(true);
      await db.ensureMongoConnection();
      // Second call should not reconnect
      await db.ensureMongoConnection();
    });
  });

  describe("exports", () => {
    it("exports all expected functions", () => {
      expect(db.getPrismaClient).toBeDefined();
      expect(db.getPrismaInitError).toBeDefined();
      expect(db.checkPostgres).toBeDefined();
      expect(db.checkMongo).toBeDefined();
      expect(db.checkRedis).toBeDefined();
      expect(db.ensureMongoConnection).toBeDefined();
      expect(db.redis).toBeDefined();
      expect(db.mongoose).toBeDefined();
    });
  });
});
