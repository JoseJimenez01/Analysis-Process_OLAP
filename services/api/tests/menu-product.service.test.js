const mockListByMenuId = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();
const mockDeleteByMenuAndProduct = jest.fn();

jest.mock("../src/repositories", () => ({
  getMenuProductRepository: () => ({
    listByMenuId: mockListByMenuId,
    findById: mockFindById,
    create: mockCreate,
    delete: mockDelete,
    deleteByMenuAndProduct: mockDeleteByMenuAndProduct
  })
}));

const MenuProductService = require("../src/services/menu-product.service");

describe("MenuProductService", () => {
  let service;
  beforeEach(() => { jest.clearAllMocks(); service = new MenuProductService(); });

  it("lists products by menu", async () => {
    mockListByMenuId.mockResolvedValue([{ id: "1" }]);
    const result = await service.listProductsByMenu("menu-1");
    expect(result).toHaveLength(1);
    expect(mockListByMenuId).toHaveBeenCalledWith("menu-1");
  });

  it("gets a menu product", async () => {
    mockFindById.mockResolvedValue({ id: "1" });
    expect((await service.getMenuProduct("1")).id).toBe("1");
  });

  it("adds a product to menu", async () => {
    mockCreate.mockResolvedValue({ id: "new" });
    expect((await service.addProductToMenu({ menuId: "m1", productId: "p1" })).id).toBe("new");
  });

  it("removes a product from menu", async () => {
    mockDelete.mockResolvedValue({ id: "1" });
    expect((await service.removeProductFromMenu("1")).id).toBe("1");
  });

  it("removes product by menu and product id", async () => {
    mockDeleteByMenuAndProduct.mockResolvedValue({ deleted: true });
    const result = await service.removeProductByMenuAndId("m1", "p1");
    expect(result.deleted).toBe(true);
    expect(mockDeleteByMenuAndProduct).toHaveBeenCalledWith("m1", "p1");
  });
});
