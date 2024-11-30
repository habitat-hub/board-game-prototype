import express, { Request, Response } from 'express';
import AccessModel from '../models/Access';
import UserModel from '../models/User';
import PrototypeModel from '../models/Prototype';
import { ensureAuthenticated } from '../middlewares/auth';
import PlayerModel from '../models/Player';
import {
  checkPrototypeAccess,
  checkPrototypeOwner,
} from '../middlewares/accessControle';
import PartModel from '../models/Part';

const router = express.Router();

// すべてのルートに認証ミドルウェアを適用
router.use(ensureAuthenticated);

router.get('/', async (req: Request, res: Response) => {
  const user = req.user as UserModel;
  const accessRights = await AccessModel.findAll({
    where: { userId: user.id },
  });
  const accessiblePrototypes = await PrototypeModel.findAll({
    where: { id: accessRights.map((p) => p.prototypeId) },
    include: [{ model: PlayerModel, as: 'players' }],
  });

  res.json(accessiblePrototypes);
});

router.post('/', async (req: Request, res: Response) => {
  const user = req.user as UserModel;

  const { name, playerCount } = req.body;
  if (!name) {
    res.status(400).json({ error: 'プロトタイプ名が必要です' });
    return;
  }
  if (playerCount === 0) {
    res.status(400).json({ error: 'プレイヤー数が必要です' });
    return;
  }

  const newPrototype = await PrototypeModel.create({
    userId: user.id,
    name,
    isEdit: true,
    isPreview: false,
    isPublic: false,
  });
  // NOTE: グループIDは編集用のプロトタイプのIDと同じにする
  await PrototypeModel.update(
    { groupId: newPrototype.id },
    { where: { id: newPrototype.id } }
  );

  await AccessModel.create({ userId: user.id, prototypeId: newPrototype.id });
  await Promise.all(
    Array.from({ length: playerCount }).map(async (_, i) => {
      await PlayerModel.create({
        prototypeId: newPrototype.id,
        name: `プレイヤー${i + 1}`,
      });
    })
  );

  res.status(201).json(newPrototype);
});

router.get(
  '/:prototypeId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = parseInt(req.params.prototypeId, 10);
    const prototype = await PrototypeModel.findByPk(prototypeId, {
      include: [{ model: PlayerModel, as: 'players' }],
    });
    if (!prototype) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }
    res.json(prototype);
  }
);

router.post(
  '/:prototypeId/preview',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const editPrototypeId = parseInt(req.params.prototypeId, 10);
    const editPrototype = await PrototypeModel.findByPk(editPrototypeId);
    if (!editPrototype?.isEdit) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    const previewPrototype = await PrototypeModel.findOne({
      where: { groupId: editPrototype.groupId, isPreview: true },
    });
    const editPrototypeParts = await PartModel.findAll({
      where: { prototypeId: editPrototypeId },
    });
    const editPrototypePlayers = await PlayerModel.findAll({
      where: { prototypeId: editPrototypeId },
    });
    if (!previewPrototype) {
      const newPrototype = await PrototypeModel.create({
        userId: editPrototype.userId,
        groupId: editPrototype.groupId,
        name: editPrototype.name,
        isEdit: false,
        isPreview: true,
        isPublic: false,
      });
      await AccessModel.create({
        userId: newPrototype.userId,
        prototypeId: newPrototype.id,
      });

      // パーツとプレイヤーをコピー
      await Promise.all(
        editPrototypeParts.map((part) =>
          part.clone({ newPrototypeId: newPrototype.id })
        )
      );
      await Promise.all(
        editPrototypePlayers.map((player) =>
          player.clone({ newPrototypeId: newPrototype.id })
        )
      );
      res.json(newPrototype);
      return;
    }

    const updatedPreviewPrototype = await PrototypeModel.update(
      { name: editPrototype.name },
      { returning: true, where: { id: previewPrototype.id } }
    );
    // 既存のパーツとプレイヤーを削除した上で、新しいパーツとプレイヤーをコピー
    await PartModel.destroy({ where: { prototypeId: previewPrototype.id } });
    await PlayerModel.destroy({ where: { prototypeId: previewPrototype.id } });
    await Promise.all(
      editPrototypeParts.map((part) =>
        part.clone({ newPrototypeId: previewPrototype.id })
      )
    );
    await Promise.all(
      editPrototypePlayers.map((player) =>
        player.clone({ newPrototypeId: previewPrototype.id })
      )
    );
    res.json(updatedPreviewPrototype[1][0]);
  }
);

router.post(
  '/:prototypeId/published',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const previewPrototypeId = parseInt(req.params.prototypeId, 10);
    const previewPrototype = await PrototypeModel.findByPk(previewPrototypeId);
    if (!previewPrototype?.isPreview) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    const publishedPrototype = await PrototypeModel.findOne({
      where: { groupId: previewPrototype.groupId, isPublic: true },
    });
    const previewPrototypeParts = await PartModel.findAll({
      where: { prototypeId: previewPrototypeId },
    });
    const previewPrototypePlayers = await PlayerModel.findAll({
      where: { prototypeId: previewPrototypeId },
    });
    if (!publishedPrototype) {
      const newPrototype = await PrototypeModel.create({
        userId: previewPrototype.userId,
        groupId: previewPrototype.groupId,
        name: previewPrototype.name,
        isEdit: false,
        isPreview: false,
        isPublic: true,
      });
      await AccessModel.create({
        userId: newPrototype.userId,
        prototypeId: newPrototype.id,
      });

      // パーツとプレイヤーをコピー
      await Promise.all(
        previewPrototypeParts.map((part) =>
          part.clone({ newPrototypeId: newPrototype.id })
        )
      );
      await Promise.all(
        previewPrototypePlayers.map((player) =>
          player.clone({ newPrototypeId: newPrototype.id })
        )
      );
      res.json(newPrototype);
      return;
    }

    const updatedPublishedPrototype = await PrototypeModel.update(
      { name: previewPrototype.name },
      { returning: true, where: { id: publishedPrototype.id } }
    );
    // 既存のパーツとプレイヤーを削除した上で、新しいパーツとプレイヤーをコピー
    await PartModel.destroy({ where: { prototypeId: publishedPrototype.id } });
    await PlayerModel.destroy({
      where: { prototypeId: publishedPrototype.id },
    });
    await Promise.all(
      previewPrototypeParts.map((part) =>
        part.clone({ newPrototypeId: publishedPrototype.id })
      )
    );
    await Promise.all(
      previewPrototypePlayers.map((player) =>
        player.clone({ newPrototypeId: publishedPrototype.id })
      )
    );
    res.json(updatedPublishedPrototype[1][0]);
  }
);

router.delete(
  '/:prototypeId',
  checkPrototypeOwner,
  async (req: Request, res: Response) => {
    const prototypeId = parseInt(req.params.prototypeId, 10);

    try {
      // まず関連するプレイヤーを削除
      await PlayerModel.destroy({ where: { prototypeId } });

      // その後プロトタイプを削除
      await PrototypeModel.destroy({ where: { id: prototypeId } });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ユーザーをプロトタイプに招待する
router.post(
  '/:prototypeId/invite/:guestId',
  checkPrototypeOwner,
  async (req, res) => {
    const prototypeId = parseInt(req.params.prototypeId, 10);
    const guestId = parseInt(req.params.guestId, 10);

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      const guest = await UserModel.findByPk(guestId);

      if (!prototype || !guest) {
        res
          .status(404)
          .json({ message: 'Prototype, User, or Inviter not found' });
        return;
      }

      await AccessModel.create({ userId: guest.id, prototypeId: prototype.id });
      res.status(200).json({ message: 'User invited successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;
