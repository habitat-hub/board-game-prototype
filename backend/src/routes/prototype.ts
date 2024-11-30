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
import { clonePlayersAndParts } from '../helpers/prototypeHelper';
import { Op } from 'sequelize';

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
        order: i,
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
    const prototype = await PrototypeModel.findByPk(prototypeId);
    if (!prototype) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    // FIXME: アクセス可能なユーザーを中間テーブルを通じて、一つの関数で取得する(現状なぜかエラーになる)
    const accessRights = await AccessModel.findAll({
      where: { prototypeId },
    });
    const accessibleUsers = await UserModel.findAll({
      where: { id: accessRights.map((p) => p.userId) },
    });

    res.json({ prototype, accessibleUsers });
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

      await clonePlayersAndParts(
        editPrototypePlayers,
        editPrototypeParts,
        newPrototype
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
    await clonePlayersAndParts(
      editPrototypePlayers,
      editPrototypeParts,
      previewPrototype
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

      await clonePlayersAndParts(
        previewPrototypePlayers,
        previewPrototypeParts,
        newPrototype
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
    await clonePlayersAndParts(
      previewPrototypePlayers,
      previewPrototypeParts,
      publishedPrototype
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
router.post('/:prototypeId/invite', checkPrototypeOwner, async (req, res) => {
  const prototypeId = parseInt(req.params.prototypeId, 10);
  const guestIds = req.body.guestIds;

  try {
    const prototype = await PrototypeModel.findByPk(prototypeId);
    const guests = await UserModel.findAll({
      where: { id: { [Op.in]: guestIds } },
    });
    if (!prototype || !guests) {
      res
        .status(404)
        .json({ message: 'Prototype, User, or Inviter not found' });
      return;
    }

    await Promise.all(
      guests.map(async (guest) => {
        await AccessModel.upsert({
          userId: guest.id,
          prototypeId: prototype.id,
        });
      })
    );
    res.status(200).json({ message: 'User invited successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
