const express = require("express");
const request = require("supertest");

jest.mock("../src/middlewares/auth", () => (req, res, next) => {
  req.user = { sub: "user-1", role: req.headers["x-user-role"] || "customer" };
  next();
});

const mockReservationService = {
  listReservations: jest.fn(),
  getReservation: jest.fn(),
  getUserReservations: jest.fn(),
  createReservation: jest.fn(),
  updateReservation: jest.fn(),
  deleteReservation: jest.fn()
};

jest.mock("../src/services/reservation.service", () =>
  jest.fn().mockImplementation(() => mockReservationService)
);

const reservationsRoutes = require("../src/routes/reservations.routes");

describe("reservations routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reservations", reservationsRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/reservations", () => {
    it("returns all reservations for admin", async () => {
      mockReservationService.listReservations.mockResolvedValue([
        { id: "res-1", userId: "user-1", restaurantId: "rest-1", partySize: 4 }
      ]);

      const response = await request(app)
        .get("/api/reservations")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(mockReservationService.listReservations).toHaveBeenCalled();
    });

    it("returns only customer's reservations for non-admin", async () => {
      mockReservationService.getUserReservations.mockResolvedValue([
        { id: "res-1", userId: "user-1", restaurantId: "rest-1", partySize: 2 }
      ]);

      const response = await request(app)
        .get("/api/reservations")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(200);
      expect(mockReservationService.getUserReservations).toHaveBeenCalledWith("user-1");
    });
  });

  describe("GET /api/reservations/:id", () => {
    it("returns a reservation (own or admin)", async () => {
      mockReservationService.getReservation.mockResolvedValue({
        id: "res-1",
        userId: "user-1",
        restaurantId: "rest-1",
        partySize: 4
      });

      const response = await request(app).get("/api/reservations/res-1");

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe("res-1");
    });

    it("forbids viewing other users' reservations", async () => {
      mockReservationService.getReservation.mockResolvedValue({
        id: "res-1",
        userId: "other-user",
        restaurantId: "rest-1"
      });

      const response = await request(app)
        .get("/api/reservations/res-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });

    it("returns 404 when reservation not found", async () => {
      mockReservationService.getReservation.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/reservations/nonexistent")
        .set("x-user-role", "admin");

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/reservations", () => {
    it("creates a reservation for authenticated customer", async () => {
      mockReservationService.createReservation.mockResolvedValue({
        id: "res-new",
        userId: "user-1",
        restaurantId: "rest-1",
        reservationDate: "2026-05-01T19:00:00Z",
        partySize: 4,
        status: "pending"
      });

      const response = await request(app)
        .post("/api/reservations")
        .set("x-user-role", "customer")
        .send({
          restaurantId: "rest-1",
          reservationDate: "2026-05-01T19:00:00Z",
          partySize: 4
        });

      expect(response.statusCode).toBe(201);
      expect(mockReservationService.createReservation).toHaveBeenCalledWith({
        userId: "user-1",
        restaurantId: "rest-1",
        reservationDate: "2026-05-01T19:00:00Z",
        partySize: 4
      });
    });

    it("forbids non-customer roles from creating", async () => {
      const response = await request(app)
        .post("/api/reservations")
        .set("x-user-role", "admin")
        .send({
          restaurantId: "rest-1",
          reservationDate: "2026-05-01T19:00:00Z",
          partySize: 4
        });

      expect(response.statusCode).toBe(403);
    });
  });

  describe("PUT /api/reservations/:id", () => {
    it("updates own reservation", async () => {
      mockReservationService.getReservation.mockResolvedValue({
        id: "res-1",
        userId: "user-1",
        restaurantId: "rest-1",
        partySize: 4
      });

      mockReservationService.updateReservation.mockResolvedValue({
        id: "res-1",
        userId: "user-1",
        restaurantId: "rest-1",
        partySize: 6,
        status: "confirmed"
      });

      const response = await request(app)
        .put("/api/reservations/res-1")
        .send({ partySize: 6, status: "confirmed" });

      expect(response.statusCode).toBe(200);
      expect(mockReservationService.updateReservation).toHaveBeenCalledWith("res-1", {
        partySize: 6,
        status: "confirmed"
      });
    });

    it("forbids updating others' reservations", async () => {
      mockReservationService.getReservation.mockResolvedValue({
        id: "res-1",
        userId: "other-user",
        restaurantId: "rest-1"
      });

      const response = await request(app)
        .put("/api/reservations/res-1")
        .set("x-user-role", "customer")
        .send({ partySize: 6 });

      expect(response.statusCode).toBe(403);
    });

    it("returns 404 when reservation not found", async () => {
      mockReservationService.getReservation.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/reservations/nonexistent")
        .set("x-user-role", "admin")
        .send({ partySize: 6 });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/reservations/:id", () => {
    it("deletes own reservation", async () => {
      mockReservationService.getReservation.mockResolvedValue({
        id: "res-1",
        userId: "user-1",
        restaurantId: "rest-1"
      });

      mockReservationService.deleteReservation.mockResolvedValue({ id: "res-1" });

      const response = await request(app).delete("/api/reservations/res-1");

      expect(response.statusCode).toBe(200);
      expect(mockReservationService.deleteReservation).toHaveBeenCalledWith("res-1");
    });

    it("forbids deleting others' reservations", async () => {
      mockReservationService.getReservation.mockResolvedValue({
        id: "res-1",
        userId: "other-user",
        restaurantId: "rest-1"
      });

      const response = await request(app)
        .delete("/api/reservations/res-1")
        .set("x-user-role", "customer");

      expect(response.statusCode).toBe(403);
    });

    it("returns 404 when reservation not found", async () => {
      mockReservationService.getReservation.mockResolvedValue(null);

      const response = await request(app).delete("/api/reservations/nonexistent");

      expect(response.statusCode).toBe(404);
    });
  });
});
