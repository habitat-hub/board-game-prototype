const express = require("express");
const router = express.Router();

let prototypes = [
  { id: 1, name: "プロトタイプ1" },
  { id: 2, name: "プロトタイプ2" },
];

router.get("/", (req, res) => {
  res.json(prototypes);
});

module.exports = router;
