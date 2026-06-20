const { getCategoryRepository } = require("../repositories");

class CategoryService {
  constructor() {
    this.repository = getCategoryRepository();
  }

  async listCategories() {
    return this.repository.list();
  }

  async getCategory(id) {
    return this.repository.findById(id);
  }

  async createCategory(payload) {
    return this.repository.create(payload);
  }

  async updateCategory(id, payload) {
    return this.repository.update(id, payload);
  }

  async deleteCategory(id) {
    return this.repository.delete(id);
  }
}

module.exports = CategoryService;
