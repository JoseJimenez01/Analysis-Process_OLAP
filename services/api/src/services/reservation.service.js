const { getReservationRepository } = require("../repositories");

class ReservationService {
  constructor() {
    this.repository = getReservationRepository();
  }

  async listReservations() {
    return this.repository.list();
  }

  async getReservation(id) {
    return this.repository.findById(id);
  }

  async getUserReservations(userId) {
    return this.repository.findByUserId(userId);
  }

  async createReservation(payload) {
    return this.repository.create(payload);
  }

  async updateReservation(id, payload) {
    return this.repository.update(id, payload);
  }

  async deleteReservation(id) {
    return this.repository.delete(id);
  }
}

module.exports = ReservationService;
