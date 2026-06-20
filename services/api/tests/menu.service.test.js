const mockList = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("../src/repositories", () => ({
  getMenuRepository: () => ({
    list: mockList,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  })
}));

const MenuService = require("../src/services/menu.service");

describe("MenuService", () => {
  let service;
  beforeEach(() => { jest.clearAllMocks(); service = new MenuService(); });

  it("lists menus", async () => {
    mockList.mockResolvedValue([{ id: "1" }]);
    const result = await service.listMenus();
    expect(result).toHaveLength(1);
  });

  it("gets a menu by id", async () => {
    mockFindById.mockResolvedValue({ id: "1" });
    expect((await service.getMenu("1")).id).toBe("1");
  });

  it("creates a menu", async () => {
    mockCreate.mockResolvedValue({ id: "new" });
    expect((await service.createMenu({ name: "M" })).id).toBe("new");
  });

  it("updates a menu", async () => {
    mockUpdate.mockResolvedValue({ id: "1", name: "U" });
    expect((await service.updateMenu("1", { name: "U" })).name).toBe("U");
  });

  it("deletes a menu", async () => {
    mockDelete.mockResolvedValue({ id: "1" });
    expect((await service.deleteMenu("1")).id).toBe("1");
  });
});
