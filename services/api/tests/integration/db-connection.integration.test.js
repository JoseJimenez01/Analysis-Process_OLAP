const { checkPostgres, checkMongo, getPrismaClient, mongoose } = require("../../src/config/db");

describe("Database Connections Integration", () => {
  jest.setTimeout(30000);

  it("should connect to PostgreSQL successfully", async () => {
    const status = await checkPostgres();
    // Only check if it's 'up' if we are in an environment where DB is running,
    // otherwise the test could fail if there is no DB.
    // Given we are running via docker-compose.test.yml, it should be 'up'
    expect(status.status).toBe("up");
    expect(status.error).toBeUndefined();
  });

  it("should connect to MongoDB successfully", async () => {
    const status = await checkMongo();
    expect(status.status).toBe("up");
    expect(status.error).toBeUndefined();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const prisma = getPrismaClient();
    if (prisma) {
      await prisma.$disconnect();
    }
  });
});
