const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.API_PORT || 3000),
  dbEngine: process.env.DB_ENGINE || "postgres",
  jwtSecret: process.env.JWT_SECRET || "change_me",
  databaseUrl: process.env.DATABASE_URL,
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  elasticUrl: process.env.ELASTIC_URL || "http://localhost:9200",
  searchServiceUrl: process.env.SEARCH_SERVICE_URL || "http://localhost:4000"
};
