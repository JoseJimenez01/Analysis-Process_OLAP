const express = require("express");
const { checkElastic } = require("../config/elasticsearch");

const router = express.Router();

router.get("/", async (req, res) => {
  const elasticsearch = await checkElastic();
  const status = elasticsearch.status === "up" ? "ok" : "degraded";

  return res.status(200).json({
    status,
    services: {
      elasticsearch
    }
  });
});

module.exports = router;
