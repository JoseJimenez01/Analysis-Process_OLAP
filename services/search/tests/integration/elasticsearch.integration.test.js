const { elastic } = require("../../src/config/elasticsearch");

describe("Elasticsearch Integration", () => {
  jest.setTimeout(30000);

  it("should connect to Elasticsearch and index/search a document", async () => {
    const testIndex = "test_integration_index";
    const documentId = "1";
    const documentBody = {
      name: "Test Document",
      description: "Integration testing with Elasticsearch",
      price: 10
    };

    try {
      // Clean up previous test index if it exists
      await elastic.indices.delete({ index: testIndex }).catch(() => {});
      
      // Index
      await elastic.index({
        index: testIndex,
        id: documentId,
        document: documentBody,
        refresh: true
      });

      // Search
      const searchResponse = await elastic.search({
        index: testIndex,
        query: {
          match: {
            name: "Test"
          }
        }
      });

      expect(searchResponse.hits.total.value).toBeGreaterThan(0);
      expect(searchResponse.hits.hits[0]._source.name).toBe(documentBody.name);
    } finally {
      // Clean up
      await elastic.indices.delete({ index: testIndex }).catch(() => {});
    }
  });
});
