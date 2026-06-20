const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const routes = require("./routes");
const swaggerSpec = require("./docs/swagger");
const env = require("./config/env");
const { cacheMiddleware, invalidateCacheMiddleware } = require("./middlewares/cache.middleware");

const app = express();

// Helmet con CSP relajado para Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://validator.swagger.io"]
      }
    }
  })
);
app.use(cors());
app.use(express.json());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300
  })
);

// Cache middlewares
app.use("/api/products", cacheMiddleware(300)); // 5 minutes
app.use("/api/menus", cacheMiddleware(600)); // 10 minutes
app.use("/api/categories", cacheMiddleware(600)); // 10 minutes
app.use(invalidateCacheMiddleware());

// Swagger JSON endpoint
app.get("/api-json", (req, res) => {
  res.json(swaggerSpec);
});

// Swagger UI
const swaggerOptions = {
  customSiteTitle: "PY01 Restaurantes — API Docs",
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 2rem; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
};

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use("/api", routes);

app.get("/", (req, res) => {
  res.status(200).json({ service: "api", status: "ok" });
});

// Handler global de errores — debe ir al final, despues de todas las rutas
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

module.exports = app;
