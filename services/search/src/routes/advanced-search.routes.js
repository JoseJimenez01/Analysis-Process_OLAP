const express = require("express");
const { elastic } = require("../config/elasticsearch");

const router = express.Router();

/**
 * @openapi
 * /search/advanced:
 *   get:
 *     summary: Advanced product search with filters and aggregations
 *     description: Search products with multiple filters, sorting, and pagination
 *     tags:
 *       - Advanced Search
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (required if no filters)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *         description: Filter by restaurant
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating (0-5)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price_asc, price_desc, rating, newest]
 *         description: Sort results
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results with metadata
 *       400:
 *         description: Invalid parameters
 *       503:
 *         description: Search service unavailable
 */
router.get("/advanced", async (req, res) => {
  try {
    const {
      q,
      categoryId,
      restaurantId,
      minPrice,
      maxPrice,
      available,
      minRating,
      sortBy = "relevance",
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const from = (pageNum - 1) * pageLimit;

    // Build query
    const filters = [];
    
    if (categoryId) {
      filters.push({ term: { categoryId } });
    }
    
    if (restaurantId) {
      filters.push({ term: { restaurantId } });
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      const range = {};
      if (minPrice !== undefined) range.gte = parseFloat(minPrice);
      if (maxPrice !== undefined) range.lte = parseFloat(maxPrice);
      filters.push({ range: { price: range } });
    }
    
    if (available === "true") {
      filters.push({ term: { available: true } });
    }
    
    if (minRating !== undefined) {
      filters.push({ range: { rating: { gte: parseFloat(minRating) } } });
    }

    let query;
    if (q && q.trim()) {
      query = {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: ["name^3", "description^2", "tags"],
                fuzziness: "AUTO"
              }
            }
          ],
          filter: filters.length > 0 ? filters : undefined
        }
      };
    } else if (filters.length > 0) {
      query = {
        bool: {
          filter: filters
        }
      };
    } else {
      return res.status(400).json({
        message: "Either query 'q' or at least one filter is required"
      });
    }

    // Build sort
    const sort = [];
    switch (sortBy) {
      case "price_asc":
        sort.push({ price: "asc" });
        break;
      case "price_desc":
        sort.push({ price: "desc" });
        break;
      case "rating":
        sort.push({ rating: "desc" });
        break;
      case "newest":
        sort.push({ createdAt: "desc" });
        break;
      case "relevance":
      default:
        sort.push("_score");
    }

    const response = await elastic.search({
      index: "products",
      query,
      from,
      size: pageLimit,
      sort,
      track_total_hits: true,
      aggs: {
        price_range: {
          range: {
            field: "price",
            ranges: [
              { to: 10 },
              { from: 10, to: 50 },
              { from: 50, to: 100 },
              { from: 100 }
            ]
          }
        },
        categories: {
          terms: {
            field: "categoryId",
            size: 10
          }
        },
        avg_rating: {
          avg: {
            field: "rating"
          }
        }
      }
    });

    return res.status(200).json({
      total: response.hits.total.value,
      page: pageNum,
      limit: pageLimit,
      totalPages: Math.ceil(response.hits.total.value / pageLimit),
      results: response.hits.hits.map((hit) => ({
        ...hit._source,
        score: hit._score
      })),
      aggregations: response.aggregations
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    return res.status(503).json({
      message: "Search service unavailable",
      error: error.message
    });
  }
});

/**
 * @openapi
 * /search/autocomplete:
 *   get:
 *     summary: Autocomplete suggestions
 *     description: Get autocomplete suggestions for product names
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial product name
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 */
router.get("/autocomplete", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: "Query must be at least 2 characters"
      });
    }

    const response = await elastic.search({
      index: "products",
      query: {
        multi_match: {
          query: q,
          fields: ["name.autocomplete", "name"],
          fuzziness: "AUTO"
        }
      },
      size: 10,
      _source: ["name", "productId"]
    });

    const suggestions = response.hits.hits.map((hit) => ({
      name: hit._source.name,
      id: hit._source.productId
    }));

    // Remove duplicates
    const unique = Array.from(
      new Map(suggestions.map((item) => [item.name, item])).values()
    );

    return res.status(200).json(unique);
  } catch (error) {
    console.error("Autocomplete error:", error);
    return res.status(503).json({
      message: "Search service unavailable",
      error: error.message
    });
  }
});

module.exports = router;
