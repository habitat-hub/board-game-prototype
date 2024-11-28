const express = require('express');
const router = express.Router();

let prototypes = [
  {
    id: 1,
    groupId: 1,
    name: 'プロトタイプ1',
    players: [{ id: '1-1', name: 'プレイヤー1' }],
    isPreview: true,
  },
  {
    id: 2,
    name: 'プロトタイプ2',
    groupId: 2,
    players: [
      { id: '2-1', name: 'プレイヤー1' },
      { id: '2-2', name: 'プレイヤー2' },
    ],
    isPreview: true,
  },
  {
    id: 3,
    name: 'プロトタイプ3',
    groupId: 1,
    players: [
      { id: '3-1', name: 'プレイヤー1' },
      { id: '3-2', name: 'プレイヤー2' },
    ],
    isPreview: false,
  },
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
  const { name, playerCount } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'プロトタイプ名が必要です' });
  }
  if (playerCount === 0) {
    return res.status(400).json({ error: 'プレイヤー数が必要です' });
  }
  const newPrototype = {
    id: prototypes.length + 1,
    name,
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: `${newPrototype.id}-${i + 1}`,
      name: `プレイヤー${i + 1}`,
    })),
  };
  prototypes.push(newPrototype);
  res.status(201).json(newPrototype);
});

// プロトタイプ削除
router.delete('/:id', (req, res) => {
  const prototypeId = parseInt(req.params.id, 10);
  prototypes = prototypes.filter((p) => p.id !== prototypeId);
  res.status(204).send();
});

module.exports = router;
