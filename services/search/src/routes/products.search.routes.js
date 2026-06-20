const express = require("express");
const { elastic } = require("../config/elasticsearch");

const router = express.Router();

/**
 * @openapi
 * /search/products:
 *   get:
 *     summary: Buscar productos
 *     description: Busca productos por nombre, descripción y precio. Permite filtrar por categoría.
 *     tags:
 *       - Búsqueda
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID de categoría para filtrar (opcional)
 */
router.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";
    const categoryFilter = req.query.category;

    if (!q.trim()) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    let query;
    if (categoryFilter) {
      query = {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: ["name^3", "description"]
              }
            }
          ],
          filter: {
            term: {
              categoryId: categoryFilter
            }
          }
        }
      };
    } else {
      query = {
        multi_match: {
          query: q,
          fields: ["name^3", "description"]
        }
      };
    }

    const response = await elastic.search({
      index: "products",
      query
    });

    return res.status(200).json(response.hits.hits.map((hit) => hit._source));
  } catch (error) {
    return res.status(503).json({ message: "Search service unavailable", error: error.message });
  }
});

/**
 * @openapi
 * /search/products/category/{categoryId}:
 *   get:
 *     summary: Filtrar productos por categoría
 *     description: Retorna productos filtrados por categoría específica
 *     tags:
 *       - Búsqueda
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 */
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId.trim()) {
      return res.status(400).json({ message: "Category ID is required" });
    }

    const response = await elastic.search({
      index: "products",
      query: {
        term: {
          categoryId: categoryId
        }
      }
    });

    return res.status(200).json(response.hits.hits.map((hit) => hit._source));
  } catch (error) {
    return res.status(503).json({ message: "Search service unavailable", error: error.message });
  }
});

module.exports = router;
