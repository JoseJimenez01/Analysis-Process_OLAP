const express = require("express");
const { checkPostgres, checkMongo, checkRedis } = require("../config/db");

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check de servicios
 *     description: |
 *       Verifica el estado de conexión con todos los servicios de persistencia:
 *       PostgreSQL, MongoDB y Redis.
 *       Retorna `ok` si todos están activos, `degraded` si alguno falla.
 *     tags:
 *       - Salud
 *     security: []
 */
router.get("/", async (req, res) => {
  const [postgres, mongodb, redis] = await Promise.all([
    checkPostgres(),
    checkMongo(),
    checkRedis()
  ]);

  const status = [postgres, mongodb, redis].every((s) => s.status === "up")
    ? "ok"
    : "degraded";

  return res.status(200).json({
    status,
    services: { postgres, mongodb, redis }
  });
});

module.exports = router;
