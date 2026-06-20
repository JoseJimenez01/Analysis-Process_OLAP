const mockIndex = jest.fn();

jest.mock("@elastic/elasticsearch", () => ({
  Client: jest.fn().mockImplementation(() => ({
    index: mockIndex
  }))
}));

jest.mock("../src/config/env", () => ({
  elasticUrl: "http://localhost:9200"
}));

const { indexRestaurant } = require("../src/indexers/restaurant.indexer");

describe("restaurant indexer (search)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("indexes a restaurant", async () => {
    mockIndex.mockResolvedValue({});
    await indexRestaurant({ id: "r1", name: "Test", description: "Nice" });
    expect(mockIndex).toHaveBeenCalledWith(expect.objectContaining({
      index: "restaurants",
      id: "r1",
      document: expect.objectContaining({ name: "Test" })
    }));
  });

  it("converts numeric id to string", async () => {
    mockIndex.mockResolvedValue({});
    await indexRestaurant({ id: 42, name: "Num" });
    expect(mockIndex).toHaveBeenCalledWith(expect.objectContaining({
      id: "42"
    }));
  });
});
