const mongoose = require("mongoose");
const Redis = require("ioredis");
const env = require("./env");

let prisma;
let prismaLoadError;
const redis = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });

let mongoConnected = false;

async function ensureMongoConnection() {
  if (mongoConnected) {
    return;
  }

  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(env.mongoUri);
  mongoConnected = true;
}

function getPrismaClient() {
  if (prisma) {
    return prisma;
  }

  try {
    if (!env.databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const { Pool } = require("pg");

    const pool = new Pool({ connectionString: env.databaseUrl });
    const adapter = new PrismaPg(pool);

    prisma = new PrismaClient({ adapter });
    prismaLoadError = null;
    return prisma;
  } catch (error) {
    prismaLoadError = error;
    return null;
  }
}

function getPrismaInitError() {
  return prismaLoadError;
}

async function checkPostgres() {
  try {
    const prismaClient = getPrismaClient();

    if (!prismaClient) {
      return { status: "down", error: "Prisma Client not generated yet" };
    }

    await prismaClient.$queryRaw`SELECT 1`;
    return { status: "up" };
  } catch (error) {
    return { status: "down", error: error.message };
  }
}

async function checkMongo() {
  try {
    await ensureMongoConnection();
    return { status: "up" };
  } catch (error) {
    return { status: "down", error: error.message };
  }
}

async function checkRedis() {
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }
    await redis.ping();
    return { status: "up" };
  } catch (error) {
    return { status: "down", error: error.message };
  }
}

module.exports = {
  getPrismaClient,
  getPrismaInitError,
  mongoose,
  redis,
  ensureMongoConnection,
  checkPostgres,
  checkMongo,
  checkRedis
};
