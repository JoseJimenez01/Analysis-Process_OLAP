const mockPing = jest.fn();

jest.mock("@elastic/elasticsearch", () => ({
  Client: jest.fn().mockImplementation(() => ({
    ping: mockPing
  }))
}));

jest.mock("../src/config/env", () => ({
  elasticUrl: "http://localhost:9200"
}));

const { checkElastic } = require("../src/config/elasticsearch");

describe("elasticsearch config", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns up when ping succeeds", async () => {
    mockPing.mockResolvedValue(true);
    const result = await checkElastic();
    expect(result.status).toBe("up");
  });

  it("returns down when ping fails", async () => {
    mockPing.mockRejectedValue(new Error("Connection refused"));
    const result = await checkElastic();
    expect(result.status).toBe("down");
    expect(result.error).toBe("Connection refused");
  });
});
