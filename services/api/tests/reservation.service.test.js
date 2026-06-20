const mockList = jest.fn();
const mockFindById = jest.fn();
const mockFindByUserId = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("../src/repositories", () => ({
  getReservationRepository: () => ({
    list: mockList,
    findById: mockFindById,
    findByUserId: mockFindByUserId,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  })
}));

const ReservationService = require("../src/services/reservation.service");

describe("ReservationService", () => {
  let service;
  beforeEach(() => { jest.clearAllMocks(); service = new ReservationService(); });

  it("lists reservations", async () => {
    mockList.mockResolvedValue([{ id: "1" }]);
    expect(await service.listReservations()).toHaveLength(1);
  });

  it("gets a reservation by id", async () => {
    mockFindById.mockResolvedValue({ id: "1" });
    expect((await service.getReservation("1")).id).toBe("1");
  });

  it("gets reservations by user id", async () => {
    mockFindByUserId.mockResolvedValue([{ id: "1", userId: "u1" }]);
    const result = await service.getUserReservations("u1");
    expect(result).toHaveLength(1);
    expect(mockFindByUserId).toHaveBeenCalledWith("u1");
  });

  it("creates a reservation", async () => {
    mockCreate.mockResolvedValue({ id: "new" });
    expect((await service.createReservation({ userId: "u1" })).id).toBe("new");
  });

  it("updates a reservation", async () => {
    mockUpdate.mockResolvedValue({ id: "1", status: "confirmed" });
    expect((await service.updateReservation("1", { status: "confirmed" })).status).toBe("confirmed");
  });

  it("deletes a reservation", async () => {
    mockDelete.mockResolvedValue({ id: "1" });
    expect((await service.deleteReservation("1")).id).toBe("1");
  });
});
