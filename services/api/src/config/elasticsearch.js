const { Client } = require("@elastic/elasticsearch");
const env = require("./env");

const elastic = new Client({ node: env.elasticUrl });

async function checkElastic() {
  try {
    await elastic.ping();
    return { status: "up" };
  } catch (error) {
    return { status: "down", error: error.message };
  }
}

module.exports = {
  elastic,
  checkElastic
};
