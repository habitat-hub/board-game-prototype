const express = require('express');
const router = express.Router();

let prototypes = [
  { id: 1, name: 'プロトタイプ1' },
  { id: 2, name: 'プロトタイプ2' },
];

// プロトタイプ一覧取得
router.get('/', (req, res) => {
  res.json(prototypes);
});

// 特定のプロトタイプを取得
router.get('/:id', (req, res) => {
  const prototypeId = parseInt(req.params.id, 10);
  const prototype = prototypes.find((p) => p.id === prototypeId);
  if (!prototype) {
    return res.status(404).json({ error: 'プロトタイプが見つかりません' });
  }
  res.json(prototype);
});

// プロトタイプ作成
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'プロトタイプ名が必要です' });
  }
  const newPrototype = { id: prototypes.length + 1, name };
  prototypes.push(newPrototype);
  res.status(201).json(newPrototype);
});

module.exports = router;
