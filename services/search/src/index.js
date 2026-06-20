const app = require("./app");
const env = require("./config/env");
const { initializeIndices } = require("./config/index-config");

async function waitForElasticsearch(maxRetries = 20, delayMs = 5000) {
  const { elastic } = require("./config/elasticsearch");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await elastic.ping();
      console.log("✓ Elasticsearch is ready");
      return;
    } catch {
      console.log(
        `Waiting for Elasticsearch... (attempt ${attempt}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Elasticsearch not available after retries");
}

async function startServer() {
  try {
    // Wait for Elasticsearch to be available before initializing indices
    if (env.nodeEnv !== "test") {
      await waitForElasticsearch();
      await initializeIndices();
    }

    app.listen(env.port, () => {
      console.log(`Search service listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start search service:", error.message);
    // Don't exit immediately — let Docker restart handle it
    setTimeout(() => process.exit(1), 3000);
  }
}

startServer();
