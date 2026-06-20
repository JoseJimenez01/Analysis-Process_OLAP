const mockIndex = jest.fn();
const mockBulk = jest.fn();

jest.mock("@elastic/elasticsearch", () => ({
  Client: jest.fn().mockImplementation(() => ({
    index: mockIndex,
    bulk: mockBulk
  }))
}));

jest.mock("../src/config/env", () => ({
  elasticUrl: "http://localhost:9200"
}));

const { indexProduct, indexBulkProducts } = require("../src/indexers/product.indexer");

describe("product indexer (search)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("normalizes product with description", async () => {
    mockIndex.mockResolvedValue({});
    await indexProduct({ id: "1", name: "Pizza", description: "Good pizza" });
    expect(mockIndex).toHaveBeenCalledWith(expect.objectContaining({
      index: "products",
      id: "1",
      document: expect.objectContaining({ description: "Good pizza" })
    }));
  });

  it("normalizes product without description", async () => {
    mockIndex.mockResolvedValue({});
    await indexProduct({ id: "2", name: "Pasta", description: null });
    expect(mockIndex).toHaveBeenCalledWith(expect.objectContaining({
      document: expect.objectContaining({ description: "Producto sin descripción" })
    }));
  });

  it("normalizes empty string description", async () => {
    mockIndex.mockResolvedValue({});
    await indexProduct({ id: "3", name: "Sushi", description: "" });
    expect(mockIndex).toHaveBeenCalledWith(expect.objectContaining({
      document: expect.objectContaining({ description: "Producto sin descripción" })
    }));
  });

  it("skips bulk when no products", async () => {
    await indexBulkProducts([]);
    expect(mockBulk).not.toHaveBeenCalled();
  });

  it("skips bulk when null", async () => {
    await indexBulkProducts(null);
    expect(mockBulk).not.toHaveBeenCalled();
  });

  it("indexes multiple products in bulk", async () => {
    mockBulk.mockResolvedValue({});
    await indexBulkProducts([
      { id: "1", name: "A", description: "Desc" },
      { id: "2", name: "B", description: null }
    ]);
    expect(mockBulk).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.arrayContaining([
        expect.objectContaining({ index: { _index: "products", _id: "1" } })
      ])
    }));
  });
});
