const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: "public" });
});

module.exports = router;
