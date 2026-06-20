const mockList = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("../src/repositories", () => ({
  getCategoryRepository: () => ({
    list: mockList,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  })
}));

const CategoryService = require("../src/services/category.service");

describe("CategoryService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoryService();
  });

  it("lists categories", async () => {
    mockList.mockResolvedValue([{ id: "1", name: "Entradas" }]);
    const result = await service.listCategories();
    expect(result).toHaveLength(1);
    expect(mockList).toHaveBeenCalled();
  });

  it("gets a category by id", async () => {
    mockFindById.mockResolvedValue({ id: "1", name: "Entradas" });
    const result = await service.getCategory("1");
    expect(result.id).toBe("1");
  });

  it("creates a category", async () => {
    mockCreate.mockResolvedValue({ id: "new", name: "Postres" });
    const result = await service.createCategory({ name: "Postres" });
    expect(result.name).toBe("Postres");
  });

  it("updates a category", async () => {
    mockUpdate.mockResolvedValue({ id: "1", name: "Updated" });
    const result = await service.updateCategory("1", { name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("deletes a category", async () => {
    mockDelete.mockResolvedValue({ id: "1" });
    const result = await service.deleteCategory("1");
    expect(result.id).toBe("1");
  });
});
