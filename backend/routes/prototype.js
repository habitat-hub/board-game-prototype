const express = require("express");
const router = express.Router();

let prototypes = [
  { id: 1, name: "プロトタイプ1" },
  { id: 2, name: "プロトタイプ2" },
];

router.get("/", (req, res) => {
  res.json(prototypes);
});

router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "プロトタイプ名が必要です" });
  }
  const newPrototype = { id: prototypes.length + 1, name };
  prototypes.push(newPrototype);
  res.status(201).json(newPrototype);
});

module.exports = router;
