import express, { Request, Response } from 'express';
import AccessModel from '../models/Access';
import UserModel from '../models/User';
import PrototypeModel from '../models/Prototype';
import { ensureAuthenticated } from '../middlewares/auth';
import PlayerModel from '../models/Player';
import {
  checkPrototypeAccess,
  checkPrototypeOwner,
} from '../middlewares/accessControl';
import PartModel from '../models/Part';
import { clonePlayersAndParts } from '../helpers/prototypeHelper';
import { Op } from 'sequelize';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

// プロトタイプ一覧取得
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

// プロトタイプ作成
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
  await PlayerModel.bulkCreate(
    Array.from({ length: playerCount }).map((_, i) => ({
      prototypeId: newPrototype.id,
      name: `プレイヤー${i + 1}`,
      order: i,
    }))
  );

  res.status(201).json(newPrototype);
});

// プロトタイプ取得
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

// プレビュー版作成
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
    const editAccessRights = await AccessModel.findAll({
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
      // プレビュー版にアクセス権を付与
      await AccessModel.bulkCreate(
        editAccessRights.map((access) => ({
          userId: access.userId,
          prototypeId: newPrototype.id,
        }))
      );

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
    await AccessModel.destroy({
      where: {
        prototypeId: previewPrototype.id,
      },
    });
    // プレビュー版にアクセス権を付与
    await AccessModel.bulkCreate(
      editAccessRights.map((access) => ({
        userId: access.userId,
        prototypeId: previewPrototype.id,
      }))
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

// 公開版作成
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
      // 公開版のアクセス権は一旦作成者のみにする
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

// プロトタイプ削除
router.delete(
  '/:prototypeId',
  checkPrototypeOwner,
  async (req: Request, res: Response) => {
    const prototypeId = parseInt(req.params.prototypeId, 10);

    try {
      await PrototypeModel.destroy({ where: { id: prototypeId } });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

// プロトタイプへのアクセス権を取得
router.get(
  '/:prototypeId/invitedUsers',
  checkPrototypeOwner,
  async (req, res) => {
    const prototypeId = parseInt(req.params.prototypeId, 10);
    const accessRights = await AccessModel.findAll({
      where: { prototypeId },
    });
    const accessibleUsers = await UserModel.findAll({
      where: { id: accessRights.map((p) => p.userId) },
    });

    res.json(accessibleUsers);
  }
);

// ユーザーにプロトタイプへのアクセス権を付与
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
        .json({ message: 'プロトタイプまたはユーザーが見つかりません' });
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

    res.status(200).json({ message: 'ユーザーを招待しました' });
  } catch (error) {
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
  }
});

router.delete(
  '/:prototypeId/invite/:guestId',
  checkPrototypeOwner,
  async (req, res) => {
    const prototypeId = parseInt(req.params.prototypeId, 10);
    const guestId = parseInt(req.params.guestId, 10);

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      if (!prototype) {
        res.status(404).json({ message: 'プロトタイプが見つかりません' });
        return;
      }

      await AccessModel.destroy({
        where: { userId: guestId, prototypeId },
      });

      res.status(200).json({ message: 'ユーザーのアクセス権を削除しました' });
    } catch (error) {
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

export default router;
