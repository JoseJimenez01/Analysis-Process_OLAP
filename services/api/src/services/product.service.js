const { getProductRepository } = require("../repositories");
const { indexProduct, deleteProductIndex } = require("../indexers/product.indexer");

class ProductService {
  constructor() {
    this.repository = getProductRepository();
  }

  async listProducts() {
    return this.repository.list();
  }

  async getProduct(id) {
    return this.repository.findById(id);
  }

  async createProduct(payload) {
    const product = await this.repository.create(payload);
    await indexProduct(product);
    return product;
  }

  async updateProduct(id, payload) {
    const product = await this.repository.update(id, payload);
    await indexProduct(product);
    return product;
  }

  async deleteProduct(id) {
    const result = await this.repository.delete(id);
    await deleteProductIndex(id);
    return result;
  }
}

module.exports = ProductService;
