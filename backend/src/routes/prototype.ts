import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import PrototypeModel from '../models/Prototype';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkGroupAccess,
  checkPrototypeAccess,
  checkPrototypeOwner,
} from '../middlewares/accessControl';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import { createPrototype } from '../factories/prototypeFactory';
import { PROTOTYPE_TYPE, UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import sequelize from '../models';
import { getAccessibleUsers } from '../helpers/useHelper';
import PrototypeVersionModel from '../models/PrototypeVersion';
import AccessModel from '../models/Access';
import { Op } from 'sequelize';
import UserAccessModel from '../models/UserAccess';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * /api/prototypes:
 *   get:
 *     summary: プロトタイプ一覧取得
 *     description: ユーザーがアクセス可能なプロトタイプの一覧を取得します。
 *     responses:
 *       '200':
 *         description: アクセス可能なプロトタイプの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: PrototypeModel
 */
router.get('/', async (req: Request, res: Response) => {
  const user = req.user as UserModel;
  const prototypes = await getAccessiblePrototypes({ userId: user.id });
  res.json(prototypes);
});

/**
 * @swagger
 * /api/prototypes:
 *   post:
 *     summary: プロトタイプ作成
 *     description: 新しいプロトタイプを作成します。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               playerCount:
 *                 type: integer
 *     responses:
 *       '201':
 *         description: 新しいプロトタイプを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type: PrototypeModel
 *       '400':
 *         description: リクエストが不正です
 *       '500':
 *         description: サーバーエラー
 */
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

  const transaction = await sequelize.transaction();
  try {
    const newPrototype = await createPrototype({
      userId: user.id,
      name,
      type: PROTOTYPE_TYPE.EDIT,
      groupId: null,
      masterPrototypeId: null,
      minPlayers: playerCount,
      maxPlayers: playerCount,
      transaction,
    });

    await transaction.commit();
    res.status(201).json(newPrototype);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   get:
 *     summary: プロトタイプ取得
 *     description: 指定されたIDのプロトタイプを取得します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプの詳細を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: PrototypeModel
 *       '404':
 *         description: プロトタイプが見つかりません
 */
router.get(
  '/:prototypeId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;
    const prototype = await PrototypeModel.findByPk(prototypeId);
    if (!prototype) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    res.json(prototype);
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   put:
 *     summary: プロトタイプ更新
 *     description: 指定されたIDのプロトタイプを更新します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプを更新しました
 *         content:
 *           application/json:
 *             schema:
 *               type: PrototypeModel
 *       '404':
 *         description: プロトタイプが見つかりません
 */
router.put(
  '/:prototypeId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;
    const prototype = await PrototypeModel.findByPk(prototypeId);
    if (!prototype) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    const updateData = Object.entries(req.body).reduce((acc, [key, value]) => {
      if (
        value !== undefined &&
        UPDATABLE_PROTOTYPE_FIELDS.PROTOTYPE.includes(key)
      ) {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {} as Partial<PrototypeModel>);
    await PrototypeModel.update(updateData, { where: { id: prototypeId } });

    res.json(prototype);
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   delete:
 *     summary: プロトタイプ削除
 *     description: 指定されたIDのプロトタイプを削除します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               type: PrototypeModel
 *       '404':
 *         description: プロトタイプが見つかりません
 */
router.delete(
  '/:prototypeId',
  checkPrototypeOwner,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;
    const prototype = await PrototypeModel.findByPk(prototypeId);
    if (!prototype) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    await PrototypeModel.destroy({ where: { id: prototypeId } });

    res.json(prototype);
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}/versions:
 *   get:
 *     summary: プロトタイプバージョン一覧取得
 *     description: 指定されたプロトタイプのバージョン一覧を取得します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプのバージョン一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prototype:
 *                   type: PrototypeModel
 *                 versions:
 *                   type: array
 *                   items:
 *                     type: PrototypeVersionModel
 *       '404':
 *         description: プロトタイプが見つかりません
 */
router.get('/:prototypeId/versions', checkPrototypeAccess, async (req, res) => {
  const prototypeId = req.params.prototypeId;
  const prototype = await PrototypeModel.findByPk(prototypeId);
  if (!prototype) {
    res.status(404).json({ error: 'プロトタイプが見つかりません' });
    return;
  }
  const versions = await PrototypeVersionModel.findAll({
    where: { prototypeId },
  });
  res.json({
    prototype,
    versions,
  });
});

/**
 * @swagger
 * /api/prototypes/groups/{groupId}:
 *   get:
 *     summary: グループのプロトタイプ一覧取得
 *     description: 指定されたグループに属するプロトタイプの一覧を取得します。
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         description: グループのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: グループに属するプロトタイプの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: PrototypeModel
 */
router.get('/groups/:groupId', checkGroupAccess, async (req, res) => {
  const groupId = req.params.groupId;
  const prototypes = await PrototypeModel.findAll({ where: { groupId } });
  const result = await Promise.all(
    prototypes.map(async (prototype) => {
      const versions = await PrototypeVersionModel.findAll({
        where: { prototypeId: prototype.id },
      });
      return {
        prototype,
        versions,
      };
    })
  );

  res.json(result);
});

/**
 * @swagger
 * /api/prototypes/groups/{groupId}/accessUsers:
 *   get:
 *     summary: グループへのアクセス権を取得
 *     description: 指定されたグループにアクセス可能なユーザーを取得します。
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         description: グループのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: アクセス可能なユーザーの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: UserModel
 */
router.get(
  '/groups/:groupId/accessUsers',
  checkGroupAccess,
  async (req: Request, res: Response) => {
    const groupId = req.params.groupId;
    res.json(await getAccessibleUsers({ groupId }));
  }
);

/**
 * @swagger
 * /api/prototypes/groups/{groupId}/invite:
 *   post:
 *     summary: ユーザーにプロトタイプへのアクセス権を付与
 *     description: 指定されたグループにユーザーを招待します。
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         description: グループのID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guestIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: ユーザーを招待しました
 *       '400':
 *         description: リクエストが不正です
 *       '404':
 *         description: グループが見つかりません
 *       '500':
 *         description: サーバーエラー
 */
router.post('/groups/:groupId/invite', checkGroupAccess, async (req, res) => {
  const groupId = req.params.groupId;
  const guestIds = req.body.guestIds;

  try {
    const access = await AccessModel.findOne({
      where: { prototypeGroupId: groupId },
    });
    if (!access) {
      res.status(400).json({ message: 'リクエストが不正です' });
      return;
    }

    const guests = await UserModel.findAll({
      where: { id: { [Op.in]: guestIds } },
    });
    if (guests.length === 0) {
      res.status(404).json({ message: '招待できるユーザーが見つかりません' });
      return;
    }

    await Promise.all(
      guests.map(async (guest) => {
        await UserAccessModel.upsert({
          userId: guest.id,
          accessId: access.id,
        });
      })
    );

    res.status(200).json({ message: 'ユーザーを招待しました' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototypes/groups/{groupId}/invite/{guestId}:
 *   delete:
 *     summary: ユーザーのアクセス権を削除
 *     description: 指定されたグループからユーザーのアクセス権を削除します。
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         description: グループのID
 *         schema:
 *           type: string
 *       - name: guestId
 *         in: path
 *         required: true
 *         description: ゲストユーザーのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: ユーザーのアクセス権を削除しました
 *       '400':
 *         description: リクエストが不正です
 *       '404':
 *         description: グループが見つかりません
 *       '500':
 *         description: サーバーエラー
 */
router.delete(
  '/groups/:groupId/invite/:guestId',
  checkGroupAccess,
  async (req, res) => {
    const groupId = req.params.groupId;
    const guestId = req.params.guestId;

    try {
      const prototype = await PrototypeModel.findOne({
        where: { groupId, type: PROTOTYPE_TYPE.EDIT },
      });
      if (!prototype) {
        throw new Error('プロトタイプが見つかりません');
      }

      if (prototype.userId === guestId) {
        res.status(400).json({ message: '作成者は削除できません' });
        return;
      }

      const access = await AccessModel.findOne({
        where: { prototypeGroupId: groupId },
      });
      if (!access) {
        res.status(400).json({ message: 'リクエストが不正です' });
        return;
      }

      await UserAccessModel.destroy({
        where: { userId: guestId, accessId: access.id },
      });

      res.status(200).json({ message: 'ユーザーのアクセス権を削除しました' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

// /**
//  * @swagger
//  * /api/prototypes/{prototypeId}/preview:
//  *   post:
//  *     summary: プレビュー版作成
//  *     description: 指定されたプロトタイプのプレビュー版を作成します。
//  *     parameters:
//  *       - name: prototypeId
//  *         in: path
//  *         required: true
//  *         description: プロトタイプのID
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       '200':
//  *         description: プレビュー版を作成しました
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.post(
//   '/:prototypeId/preview',
//   checkPrototypeAccess,
//   async (req: Request, res: Response) => {
//     const editPrototypeId = parseInt(req.params.prototypeId, 10);
//     const editPrototype = await PrototypeModel.findByPk(editPrototypeId);
//     if (!editPrototype?.isEdit) {
//       res.status(404).json({ error: 'プロトタイプが見つかりません' });
//       return;
//     }

//     const previewPrototype = await PrototypeModel.findOne({
//       where: { groupId: editPrototype.groupId, isPreview: true },
//     });
//     const editPrototypeParts = await PartModel.findAll({
//       where: { prototypeId: editPrototypeId },
//     });
//     const editPrototypePlayers = await PlayerModel.findAll({
//       where: { prototypeId: editPrototypeId },
//     });
//     const editAccessRights = await AccessModel.findAll({
//       where: { prototypeId: editPrototypeId },
//     });
//     if (!previewPrototype) {
//       const newPrototype = await PrototypeModel.create({
//         userId: editPrototype.userId,
//         groupId: editPrototype.groupId,
//         name: editPrototype.name,
//         isEdit: false,
//         isPreview: true,
//         isPublic: false,
//       });
//       // プレビュー版にアクセス権を付与
//       await AccessModel.bulkCreate(
//         editAccessRights.map((access) => ({
//           userId: access.userId,
//           prototypeId: newPrototype.id,
//         }))
//       );

//       await clonePlayersAndParts(
//         editPrototypePlayers,
//         editPrototypeParts,
//         newPrototype
//       );

//       res.json(newPrototype);
//       return;
//     }

//     const updatedPreviewPrototype = await PrototypeModel.update(
//       { name: editPrototype.name },
//       { returning: true, where: { id: previewPrototype.id } }
//     );
//     await AccessModel.destroy({
//       where: {
//         prototypeId: previewPrototype.id,
//       },
//     });
//     // プレビュー版にアクセス権を付与
//     await AccessModel.bulkCreate(
//       editAccessRights.map((access) => ({
//         userId: access.userId,
//         prototypeId: previewPrototype.id,
//       }))
//     );

//     // 既存のパーツとプレイヤーを削除した上で、新しいパーツとプレイヤーをコピー
//     await PartModel.destroy({ where: { prototypeId: previewPrototype.id } });
//     await PlayerModel.destroy({ where: { prototypeId: previewPrototype.id } });
//     await clonePlayersAndParts(
//       editPrototypePlayers,
//       editPrototypeParts,
//       previewPrototype
//     );
//     res.json(updatedPreviewPrototype[1][0]);
//   }
// );

export default router;
