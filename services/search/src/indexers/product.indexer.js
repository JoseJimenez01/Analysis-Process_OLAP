const { elastic } = require("../config/elasticsearch");

function normalizeProduct(product) {
  return {
    ...product,
    description: product.description || "Producto sin descripción"
  };
}

async function indexProduct(product) {
  const normalized = normalizeProduct(product);
  return elastic.index({
    index: "products",
    id: String(product.id),
    document: normalized,
    refresh: true
  });
}

async function indexBulkProducts(products) {
  if (!products || products.length === 0) return;

  const body = products.flatMap((product) => [
    { index: { _index: "products", _id: String(product.id) } },
    normalizeProduct(product)
  ]);

  return elastic.bulk({ body, refresh: true });
}

module.exports = {
  indexProduct,
  indexBulkProducts
};
