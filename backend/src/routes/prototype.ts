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
import {
  createPrototype,
  createPrototypeVersion,
  deletePrototypeVersion,
} from '../factories/prototypeFactory';
import { UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import sequelize from '../models';
import { getAccessibleUsers } from '../helpers/userHelper';
import PrototypeVersionModel from '../models/PrototypeVersion';
import AccessModel from '../models/Access';
import { Op } from 'sequelize';
import UserAccessModel from '../models/UserAccess';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 *   name: Prototypes
 *   description: プロトタイプ管理API
 */

/**
 * @swagger
 * /api/prototypes:
 *   get:
 *     tags: [Prototypes]
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
 *                 $ref: '#/components/schemas/Prototype'
 */
router.get('/', async (req: Request, res: Response) => {
  const user = req.user as UserModel;

  try {
    const prototypes = await getAccessiblePrototypes({ userId: user.id });

    res.json(prototypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototypes:
 *   post:
 *     tags: [Prototypes]
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
 *               $ref: '#/components/schemas/Prototype'
 *       '400':
 *         description: リクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
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
      type: 'EDIT',
      groupId: null,
      editPrototypeDefaultVersionId: null,
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
 *     tags: [Prototypes]
 *     summary: プロトタイプ取得
 *     description: 指定されたIDのプロトタイプを取得します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプの詳細を返します
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.get(
  '/:prototypeId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);

      if (!prototype) {
        res.status(404).json({ error: 'プロトタイプが見つかりません' });
        return;
      }

      res.json(prototype);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   put:
 *     tags: [Prototypes]
 *     summary: プロトタイプ更新
 *     description: 指定されたIDのプロトタイプを更新します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               minPlayers:
 *                 type: integer
 *               maxPlayers:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプを更新しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.put(
  '/:prototypeId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);

      if (!prototype) {
        res.status(404).json({ error: 'プロトタイプが見つかりません' });
        return;
      }

      const updateData = Object.entries(req.body).reduce(
        (acc, [key, value]) => {
          if (
            value !== undefined &&
            UPDATABLE_PROTOTYPE_FIELDS.PROTOTYPE.includes(key)
          ) {
            return { ...acc, [key]: value };
          }
          return acc;
        },
        {} as Partial<PrototypeModel>
      );
      await PrototypeModel.update(updateData, { where: { id: prototypeId } });

      res.json(prototype);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   delete:
 *     tags: [Prototypes]
 *     summary: プロトタイプ削除
 *     description: 指定されたIDのプロトタイプを削除します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.delete(
  '/:prototypeId',
  checkPrototypeOwner,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      if (!prototype) {
        res.status(404).json({ error: 'プロトタイプが見つかりません' });
        return;
      }

      await PrototypeModel.destroy({ where: { id: prototypeId } });

      res.json({ message: 'プロトタイプを削除しました' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}/versions:
 *   get:
 *     tags: [Prototypes]
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
 *               required:
 *                 - prototype
 *                 - versions
 *               properties:
 *                 prototype:
 *                   $ref: '#/components/schemas/Prototype'
 *                 versions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrototypeVersion'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.get('/:prototypeId/versions', checkPrototypeAccess, async (req, res) => {
  const prototypeId = req.params.prototypeId;

  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototypes/groups/{groupId}:
 *   get:
 *     tags: [Prototypes]
 *     summary: グループのプロトタイプ一覧取得
 *     description: 指定されたグループに属するプロトタイプの一覧を作成日の古い順で取得します。
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
 *                 type: object
 *                 required:
 *                   - prototype
 *                   - versions
 *                 properties:
 *                   prototype:
 *                     $ref: '#/components/schemas/Prototype'
 *                   versions:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/PrototypeVersion'
 */
router.get('/groups/:groupId', checkGroupAccess, async (req, res) => {
  const groupId = req.params.groupId;
  try {
    const prototypes = await PrototypeModel.findAll({
      where: { groupId },
      order: [['createdAt', 'ASC']],
    });
    const result = await Promise.all(
      prototypes.map(async (prototype) => {
        const versions = await PrototypeVersionModel.findAll({
          where: { prototypeId: prototype.id },
          order: [['createdAt', 'ASC']],
        });
        return {
          prototype,
          versions,
        };
      })
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototypes/groups/{groupId}/accessUsers:
 *   get:
 *     tags: [Prototypes]
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
 *                 $ref: '#/components/schemas/User'
 */
router.get(
  '/groups/:groupId/accessUsers',
  checkGroupAccess,
  async (req: Request, res: Response) => {
    const groupId = req.params.groupId;

    try {
      res.json(await getAccessibleUsers({ groupId }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/groups/{groupId}/invite:
 *   post:
 *     tags: [Prototypes]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: リクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '404':
 *         description: グループが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
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
 *     tags: [Prototypes]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: リクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '404':
 *         description: グループが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.delete(
  '/groups/:groupId/invite/:guestId',
  checkGroupAccess,
  async (req, res) => {
    const groupId = req.params.groupId;
    const guestId = req.params.guestId;

    try {
      const prototype = await PrototypeModel.findOne({
        where: { groupId, type: 'EDIT' },
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

/**
 * @swagger
 * /api/prototypes/{prototypeId}/duplicate:
 *   post:
 *     tags: [Prototypes]
 *     summary: プロトタイプの複製
 *     description: 指定されたプロトタイプを複製します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプを複製しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post(
  '/:prototypeId/duplicate',
  checkPrototypeAccess,
  async (req, res) => {
    const prototypeId = req.params.prototypeId;
    const prototype = await PrototypeModel.findByPk(prototypeId);
    if (!prototype) {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    const transaction = await sequelize.transaction();

    try {
      await createPrototype({
        userId: prototype.userId,
        name: `${prototype.name} - 複製版`,
        type: 'EDIT',
        groupId: null,
        editPrototypeDefaultVersionId: null,
        minPlayers: prototype.minPlayers,
        maxPlayers: prototype.maxPlayers,
        transaction,
        needsPartDuplicate: true,
      });

      await transaction.commit();
      res.status(200).json({ message: 'プロトタイプを複製しました' });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}/preview:
 *   post:
 *     tags: [Prototypes]
 *     summary: プレビュー版作成
 *     description: 指定されたプロトタイプのプレビュー版を作成します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プレビュー版を作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post(
  '/:prototypeId/preview',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const editPrototypeId = req.params.prototypeId;
    const editPrototype = await PrototypeModel.findByPk(editPrototypeId);
    if (!editPrototype || editPrototype.type !== 'EDIT') {
      res.status(404).json({ error: 'プロトタイプが見つかりません' });
      return;
    }

    const editPrototypeDefaultVersion = await PrototypeVersionModel.findOne({
      where: { prototypeId: editPrototype.id },
    });
    if (!editPrototypeDefaultVersion) {
      res.status(404).json({ error: 'デフォルトバージョンが見つかりません' });
      return;
    }

    const transaction = await sequelize.transaction();
    try {
      const previewPrototype = await createPrototype({
        userId: editPrototype.userId,
        name: `${editPrototype.name} - プレビュー版`,
        type: 'PREVIEW',
        groupId: editPrototype.groupId,
        editPrototypeDefaultVersionId: editPrototypeDefaultVersion.id,
        minPlayers: editPrototype.minPlayers,
        maxPlayers: editPrototype.maxPlayers,
        transaction,
        needsPartDuplicate: true,
      });

      await transaction.commit();
      res.status(200).json(previewPrototype);
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}/versions/{prototypeVersionId}:
 *   post:
 *     tags: [Prototypes]
 *     summary: バージョン作成
 *     description: 指定されたプロトタイプのバージョンを作成します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *       - name: prototypeVersionId
 *         in: path
 *         required: true
 *         description: バージョンのID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: 新しいバージョンの説明
 *     responses:
 *       '200':
 *         description: 新しいバージョンを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: リクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '404':
 *         description: バージョンが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post(
  '/:prototypeId/versions/:prototypeVersionId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeVersionId = req.params.prototypeVersionId;
    const { description } = req.body;
    const prototypeVersion =
      await PrototypeVersionModel.findByPk(prototypeVersionId);

    if (!prototypeVersion) {
      res.status(400).json({ error: 'リクエストが不正です' });
      return;
    }

    const transaction = await sequelize.transaction();
    try {
      await createPrototypeVersion(prototypeVersion, description, transaction);
      await transaction.commit();
      res.status(200).json({ message: '新しいバージョンを作成しました' });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}/versions/{prototypeVersionId}:
 *   delete:
 *     tags: [Prototypes]
 *     summary: バージョン削除
 *     description: 指定されたプロトタイプのバージョンを削除します。マスターバージョン（0.0.0）は削除できません。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *       - name: prototypeVersionId
 *         in: path
 *         required: true
 *         description: バージョンのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: バージョンを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: マスターバージョンは削除できません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '404':
 *         description: バージョンが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.delete(
  '/:prototypeId/versions/:prototypeVersionId',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;
    const prototypeVersionId = req.params.prototypeVersionId;

    const transaction = await sequelize.transaction();

    try {
      const result = await deletePrototypeVersion(
        prototypeVersionId,
        prototypeId,
        transaction
      );

      if (!result.success) {
        await transaction.rollback();
        res
          .status(result.message === 'バージョンが見つかりません' ? 404 : 400)
          .json({ error: result.message });
        return;
      }

      await transaction.commit();
      res.status(200).json({ message: result.message });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

export default router;
