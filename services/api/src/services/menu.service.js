const { getMenuRepository } = require("../repositories");

class MenuService {
  constructor() {
    this.repository = getMenuRepository();
  }

  async listMenus() {
    return this.repository.list();
  }

  async getMenu(id) {
    return this.repository.findById(id);
  }

  async createMenu(payload) {
    return this.repository.create(payload);
  }

  async updateMenu(id, payload) {
    return this.repository.update(id, payload);
  }

  async deleteMenu(id) {
    return this.repository.delete(id);
  }
}

module.exports = MenuService;
