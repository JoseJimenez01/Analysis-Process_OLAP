const { getMenuProductRepository } = require("../repositories");

class MenuProductService {
  constructor() {
    this.repository = getMenuProductRepository();
  }

  async listProductsByMenu(menuId) {
    return this.repository.listByMenuId(menuId);
  }

  async getMenuProduct(id) {
    return this.repository.findById(id);
  }

  async addProductToMenu(payload) {
    return this.repository.create(payload);
  }

  async removeProductFromMenu(id) {
    return this.repository.delete(id);
  }

  async removeProductByMenuAndId(menuId, productId) {
    return this.repository.deleteByMenuAndProduct(menuId, productId);
  }
}

module.exports = MenuProductService;
