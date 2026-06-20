const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const healthRoutes = require("./routes/health.routes");
const searchRoutes = require("./routes/search.routes");
const productsSearchRoutes = require("./routes/products.search.routes");
const advancedSearchRoutes = require("./routes/advanced-search.routes");
const reindexRoutes = require("./routes/reindex.routes");
const env = require("./config/env");
const { cacheMiddleware } = require("./middlewares/cache.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Cache search results for 10 minutes
app.use("/search/products", cacheMiddleware(600));
app.use("/search/advanced", cacheMiddleware(600));

app.use("/health", healthRoutes);
app.use("/search", searchRoutes);
app.use("/search/products", productsSearchRoutes);
app.use("/search/advanced", advancedSearchRoutes);

// Only mount reindex route in non-test environments
if (env.nodeEnv !== "test") {
  app.use("/search/reindex", reindexRoutes);
}

app.get("/", (req, res) => {
  res.status(200).json({ service: "search", status: "ok" });
});

// Handler global de errores — debe ir al final, despues de todas las rutas
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

module.exports = app;