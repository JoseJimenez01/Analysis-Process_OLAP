const { elastic } = require("../config/elasticsearch");

function normalizeProduct(product) {
  return {
    ...product,
    description: product.description || "Producto sin descripción"
  };
}

async function indexProduct(product) {
  try {
    const normalized = normalizeProduct(product);
    await elastic.index({
      index: "products",
      id: String(product.id),
      document: normalized,
      refresh: true
    });
  } catch (error) {
    console.error("Error indexing product:", error.message);
    // Don't throw - allow DB operations to succeed even if ES fails
  }
}

async function deleteProductIndex(productId) {
  try {
    await elastic.delete({
      index: "products",
      id: String(productId),
      refresh: true
    });
  } catch (error) {
    // Ignore if document doesn't exist
    if (error.statusCode !== 404) {
      console.error("Error deleting product from index:", error.message);
    }
  }
}

module.exports = {
  indexProduct,
  deleteProductIndex
};
