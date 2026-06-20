/**
 * Jest setup file — runs BEFORE any test module is loaded.
 * Sets environment variables for the unit test suite so that dotenv.config()
 * in src/config/env.js finds correct values and never falls back to the
 * root .env (which uses Docker service hostnames / credentials that don't
 * exist in a plain Jest run or CI without those services).
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test_user:test_password@localhost:5432/test_db";
process.env.MONGO_URI = "mongodb://localhost:27017/test_db";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.ELASTIC_URL = "http://localhost:9200";
process.env.API_PORT = "3000";
process.env.SEARCH_PORT = "4000";
process.env.JWT_SECRET = "test_secret";
process.env.DB_ENGINE = "postgres";
