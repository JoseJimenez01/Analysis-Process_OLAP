const { elastic } = require("./elasticsearch");

/**
 * Product Index Mapping Configuration
 * Optimized for full-text search and aggregations
 */
const productsIndexConfig = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        text_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "stop", "snowball"]
        },
        autocomplete_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "stop", "edge_ngram_filter"]
        }
      },
      filter: {
        edge_ngram_filter: {
          type: "edge_ngram",
          min_gram: 2,
          max_gram: 20
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      productId: { type: "keyword" },
      name: {
        type: "text",
        analyzer: "text_analyzer",
        fields: {
          keyword: { type: "keyword" },
          autocomplete: { type: "text", analyzer: "autocomplete_analyzer" }
        }
      },
      description: {
        type: "text",
        analyzer: "text_analyzer"
      },
      price: {
        type: "float",
        index: true
      },
      categoryId: {
        type: "keyword"
      },
      restaurantId: {
        type: "keyword"
      },
      available: {
        type: "boolean"
      },
      rating: {
        type: "float"
      },
      reviews: {
        type: "integer"
      },
      tags: {
        type: "keyword"
      },
      createdAt: {
        type: "date"
      },
      updatedAt: {
        type: "date"
      }
    }
  }
};

/**
 * Restaurant Index Mapping Configuration
 */
const restaurantsIndexConfig = {
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        text_analyzer: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "stop", "snowball"]
        }
      }
    }
  },
  mappings: {
    properties: {
      id: { type: "keyword" },
      name: {
        type: "text",
        analyzer: "text_analyzer",
        fields: {
          keyword: { type: "keyword" }
        }
      },
      description: {
        type: "text",
        analyzer: "text_analyzer"
      },
      address: {
        type: "text",
        analyzer: "text_analyzer"
      },
      category: {
        type: "keyword"
      },
      rating: {
        type: "float"
      },
      reviews: {
        type: "integer"
      },
      openingHours: {
        type: "nested",
        properties: {
          day: { type: "keyword" },
          open: { type: "text" },
          close: { type: "text" }
        }
      },
      createdAt: {
        type: "date"
      }
    }
  }
};

/**
 * Initialize indices with proper configuration
 */
async function initializeIndices() {
  try {
    console.log("Initializing ElasticSearch indices...");

    // Check if products index exists
    const productsExists = await elastic.indices.exists({ index: "products" });
    if (!productsExists) {
      console.log("Creating 'products' index...");
      await elastic.indices.create({
        index: "products",
        body: productsIndexConfig
      });
      console.log("✓ Products index created");
    } else {
      console.log("✓ Products index already exists");
    }

    // Check if restaurants index exists
    const restaurantsExists = await elastic.indices.exists({ index: "restaurants" });
    if (!restaurantsExists) {
      console.log("Creating 'restaurants' index...");
      await elastic.indices.create({
        index: "restaurants",
        body: restaurantsIndexConfig
      });
      console.log("✓ Restaurants index created");
    } else {
      console.log("✓ Restaurants index already exists");
    }

    console.log("✓ All indices initialized successfully");
  } catch (error) {
    console.error("Error initializing ElasticSearch indices:", error.message);
    throw error;
  }
}

/**
 * Get index statistics
 */
async function getIndexStats() {
  try {
    const stats = await elastic.indices.stats({ index: "_all" });
    return {
      indices: stats.indices,
      total: stats._all
    };
  } catch (error) {
    console.error("Error getting index stats:", error.message);
    return null;
  }
}

module.exports = {
  initializeIndices,
  getIndexStats,
  productsIndexConfig,
  restaurantsIndexConfig
};
