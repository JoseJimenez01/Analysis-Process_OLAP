const express = require("express");
const { elastic } = require("../config/elasticsearch");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";

    if (!q.trim()) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    const response = await elastic.search({
      index: "restaurants",
      query: {
        multi_match: {
          query: q,
          fields: ["name^3", "description", "address", "category"]
        }
      }
    });

    return res.status(200).json(response.hits.hits.map((hit) => hit._source));
  } catch (error) {
    return res.status(503).json({ message: "Search service unavailable", error: error.message });
  }
});

module.exports = router;
