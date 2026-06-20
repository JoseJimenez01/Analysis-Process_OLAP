const { getRestaurantRepository } = require("../repositories");

class RestaurantService {
  constructor() {
    this.repository = getRestaurantRepository();
  }

  async listRestaurants() {
    return this.repository.list();
  }

  async getRestaurant(id) {
    return this.repository.findById(id);
  }

  async createRestaurant(payload) {
    return this.repository.create(payload);
  }

  async updateRestaurant(id, payload) {
    return this.repository.update(id, payload);
  }

  async deleteRestaurant(id) {
    return this.repository.delete(id);
  }
}

module.exports = RestaurantService;
