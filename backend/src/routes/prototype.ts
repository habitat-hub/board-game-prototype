import express, { Request, Response } from 'express';
import { prototypes } from '../server';
import { Prototype } from '../type';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json(prototypes);
});

router.get('/:id', (req: Request, res: Response) => {
  const prototypeId = parseInt(req.params.id, 10);
  const prototype = prototypes.find((p) => p.id === prototypeId);
  if (!prototype) {
    res.status(404).json({ error: 'プロトタイプが見つかりません' });
    return;
  }
  res.json(prototype);
});

router.post('/', (req: Request, res: Response) => {
  const { name, playerCount } = req.body;
  if (!name) {
    res.status(400).json({ error: 'プロトタイプ名が必要です' });
    return;
  }
  if (playerCount === 0) {
    res.status(400).json({ error: 'プレイヤー数が必要です' });
    return;
  }
  const newPrototype: Prototype = {
    id: prototypes.length + 1,
    name,
    groupId: prototypes.length + 1, // Assuming groupId is the same as id for simplicity
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: `${prototypes.length + 1}-${i + 1}`,
      name: `プレイヤー${i + 1}`,
    })),
    isPreview: true,
    parts: [],
  };
  prototypes.push(newPrototype);
  res.status(201).json(newPrototype);
});

router.delete('/:id', (req: Request, res: Response) => {
  const prototypeId = parseInt(req.params.id, 10);
  delete prototypes[prototypeId];
  res.status(204).send();
});

export default router;
