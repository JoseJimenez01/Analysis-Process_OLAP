/**
 * Jest setup file — runs BEFORE any test module is loaded.
 * Sets environment variables for the unit test suite so that dotenv.config()
 * in src/config/env.js finds correct values and never falls back to the
 * root .env (which uses Docker service hostnames that don't resolve in CI
 * without the full Compose stack).
 */
process.env.NODE_ENV = "test";
process.env.SEARCH_PORT = "4000";
process.env.DB_ENGINE = "postgres";
process.env.ELASTIC_URL = "http://localhost:9200";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.MONGO_URI = "mongodb://localhost:27017/test_db";
process.env.DATABASE_URL = "postgresql://test_user:test_password@localhost:5432/test_db";
