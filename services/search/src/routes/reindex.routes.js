const express = require("express");

const router = express.Router();

// Middleware básico de autenticación para reindex
function requireReindexAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-api-key"];
  const reindexToken = req.headers["x-reindex-token"];
  const envToken = process.env.SEARCH_REINDEX_TOKEN;

  if (!envToken) {
    return res.status(500).json({ message: "Reindex token not configured" });
  }

  // Validar Bearer token
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === envToken) {
      return next();
    }
  }

  // Validar API key
  if (apiKey && apiKey === envToken) {
    return next();
  }

  // Validar x-reindex-token
  if (reindexToken && reindexToken === envToken) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}

/**
 * @openapi
 * /search/reindex:
 *   post:
 *     summary: Reindexar datos
 *     description: Reindexación manual de todos los índices (restaurantes y productos) desde la base de datos. Requiere autenticación.
 *     tags:
 *       - Búsqueda
 *     security:
 *       - bearerAuth: []
 */
router.post("/", requireReindexAuth, async (req, res) => {
  try {
    // Lazy import to avoid module loading failures during tests
    const { reindexAll } = require("../indexers/reindex.service");
    const result = await reindexAll();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Reindex error:", error);
    return res.status(500).json({
      message: "Reindex failed",
      error: error.message
    });
  }
});

module.exports = router;

