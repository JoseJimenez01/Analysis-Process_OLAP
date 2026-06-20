const mockList = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockIndexProduct = jest.fn();
const mockDeleteProductIndex = jest.fn();

jest.mock("../src/repositories", () => ({
  getProductRepository: () => ({
    list: mockList,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete
  })
}));

jest.mock("../src/indexers/product.indexer", () => ({
  indexProduct: mockIndexProduct,
  deleteProductIndex: mockDeleteProductIndex
}));

const ProductService = require("../src/services/product.service");

describe("ProductService", () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductService();
  });

  it("lists products", async () => {
    mockList.mockResolvedValue([{ id: "1", name: "Pizza" }]);
    const result = await service.listProducts();
    expect(result).toHaveLength(1);
  });

  it("gets a product by id", async () => {
    mockFindById.mockResolvedValue({ id: "1", name: "Pizza" });
    const result = await service.getProduct("1");
    expect(result.name).toBe("Pizza");
  });

  it("creates a product and indexes it", async () => {
    const product = { id: "new", name: "Pasta" };
    mockCreate.mockResolvedValue(product);
    mockIndexProduct.mockResolvedValue();

    const result = await service.createProduct({ name: "Pasta" });
    expect(result.name).toBe("Pasta");
    expect(mockIndexProduct).toHaveBeenCalledWith(product);
  });

  it("updates a product and re-indexes it", async () => {
    const product = { id: "1", name: "Updated" };
    mockUpdate.mockResolvedValue(product);
    mockIndexProduct.mockResolvedValue();

    const result = await service.updateProduct("1", { name: "Updated" });
    expect(result.name).toBe("Updated");
    expect(mockIndexProduct).toHaveBeenCalledWith(product);
  });

  it("deletes a product and removes from index", async () => {
    mockDelete.mockResolvedValue({ id: "1" });
    mockDeleteProductIndex.mockResolvedValue();

    const result = await service.deleteProduct("1");
    expect(result.id).toBe("1");
    expect(mockDeleteProductIndex).toHaveBeenCalledWith("1");
  });
});
