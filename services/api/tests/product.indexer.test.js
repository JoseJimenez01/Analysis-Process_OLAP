const { indexProduct, deleteProductIndex } = require("../src/indexers/product.indexer");

jest.mock("../src/config/elasticsearch", () => ({
  elastic: {
    index: jest.fn(),
    delete: jest.fn()
  }
}));

const { elastic } = require("../src/config/elasticsearch");

describe("product indexer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("indexProduct", () => {
    it("normalizes product with null description", async () => {
      const product = {
        id: "prod-1",
        name: "Pizza",
        description: null,
        price: 12.99,
        categoryId: "cat-1"
      };

      elastic.index.mockResolvedValue({ _id: "prod-1" });

      await indexProduct(product);

      expect(elastic.index).toHaveBeenCalledWith({
        index: "products",
        id: "prod-1",
        document: {
          id: "prod-1",
          name: "Pizza",
          description: "Producto sin descripción",
          price: 12.99,
          categoryId: "cat-1"
        },
        refresh: true
      });
    });

    it("keeps existing description if provided", async () => {
      const product = {
        id: "prod-2",
        name: "Pasta",
        description: "Delicious homemade pasta",
        price: 14.99,
        categoryId: "cat-2"
      };

      elastic.index.mockResolvedValue({ _id: "prod-2" });

      await indexProduct(product);

      expect(elastic.index).toHaveBeenCalledWith({
        index: "products",
        id: "prod-2",
        document: {
          id: "prod-2",
          name: "Pasta",
          description: "Delicious homemade pasta",
          price: 14.99,
          categoryId: "cat-2"
        },
        refresh: true
      });
    });

    it("handles empty string description", async () => {
      const product = {
        id: "prod-3",
        name: "Risotto",
        description: "",
        price: 13.99,
        categoryId: "cat-3"
      };

      elastic.index.mockResolvedValue({ _id: "prod-3" });

      await indexProduct(product);

      expect(elastic.index).toHaveBeenCalledWith({
        index: "products",
        id: "prod-3",
        document: expect.objectContaining({
          description: "Producto sin descripción"
        }),
        refresh: true
      });
    });

    it("handles Elasticsearch errors gracefully", async () => {
      const product = {
        id: "prod-4",
        name: "Risotto",
        description: null,
        price: 15.99
      };

      elastic.index.mockRejectedValue(new Error("ES connection error"));

      // Should not throw
      await indexProduct(product);

      expect(elastic.index).toHaveBeenCalled();
    });
  });

  describe("deleteProductIndex", () => {
    it("deletes product from index", async () => {
      elastic.delete.mockResolvedValue({ result: "deleted" });

      await deleteProductIndex("prod-1");

      expect(elastic.delete).toHaveBeenCalledWith({
        index: "products",
        id: "prod-1",
        refresh: true
      });
    });

    it("handles 404 errors gracefully", async () => {
      const error = new Error("Not found");
      error.statusCode = 404;
      elastic.delete.mockRejectedValue(error);

      // Should not throw
      await deleteProductIndex("nonexistent");

      expect(elastic.delete).toHaveBeenCalled();
    });

    it("logs other errors but does not throw", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      const error = new Error("ES connection error");
      error.statusCode = 500;
      elastic.delete.mockRejectedValue(error);

      // Should not throw
      await deleteProductIndex("prod-1");

      consoleError.mockRestore();
    });
  });
});
