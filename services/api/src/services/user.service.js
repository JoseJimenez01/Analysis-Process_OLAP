const { getUserRepository } = require("../repositories");

class UserService {
  constructor() {
    this.repository = getUserRepository();
  }

  async listUsers() {
    return this.repository.list();
  }

  async getUser(id) {
    return this.repository.findById(id);
  }

  async getUserByEmail(email) {
    return this.repository.findByEmail(email);
  }

  async createUser(payload) {
    return this.repository.create(payload);
  }

  async updateUser(id, payload) {
    return this.repository.update(id, payload);
  }

  async deleteUser(id) {
    return this.repository.delete(id);
  }
}

module.exports = UserService;
