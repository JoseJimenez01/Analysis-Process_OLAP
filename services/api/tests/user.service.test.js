const mockList = jest.fn();
const mockFindById = jest.fn();
const mockFindByEmail = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("../src/repositories", () => ({
  getUserRepository: () => ({
    list: mockList,
    findById: mockFindById,
    findByEmail: mockFindByEmail,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  })
}));

const UserService = require("../src/services/user.service");

describe("UserService", () => {
  let service;
  beforeEach(() => { jest.clearAllMocks(); service = new UserService(); });

  it("lists users", async () => {
    mockList.mockResolvedValue([{ id: "1" }]);
    expect(await service.listUsers()).toHaveLength(1);
  });

  it("gets user by id", async () => {
    mockFindById.mockResolvedValue({ id: "1" });
    expect((await service.getUser("1")).id).toBe("1");
  });

  it("gets user by email", async () => {
    mockFindByEmail.mockResolvedValue({ id: "1", email: "a@b.com" });
    const result = await service.getUserByEmail("a@b.com");
    expect(result.email).toBe("a@b.com");
    expect(mockFindByEmail).toHaveBeenCalledWith("a@b.com");
  });

  it("creates a user", async () => {
    mockCreate.mockResolvedValue({ id: "new" });
    expect((await service.createUser({ name: "X" })).id).toBe("new");
  });

  it("updates a user", async () => {
    mockUpdate.mockResolvedValue({ id: "1", name: "U" });
    expect((await service.updateUser("1", { name: "U" })).name).toBe("U");
  });

  it("deletes a user", async () => {
    mockDelete.mockResolvedValue({ id: "1" });
    expect((await service.deleteUser("1")).id).toBe("1");
  });
});
