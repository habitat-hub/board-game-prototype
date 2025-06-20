import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import PrototypeGroupModel from '../models/PrototypeGroup';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkPrototypeGroupAccess,
  checkPrototypeGroupOwner,
} from '../middlewares/accessControl';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import sequelize from '../models';
import {
  createPrototypeInstance,
  createPrototypeGroup,
  createPrototypeVersion,
} from '../factories/prototypeFactory';
import PrototypeModel from '../models/Prototype';
import { Op } from 'sequelize';
import { getAccessibleUsers } from '../helpers/userHelper';
import AccessModel from '../models/Access';
import UserAccessModel from '../models/UserAccess';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * /api/prototype-groups:
 *   get:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループ一覧取得
 *     description: ユーザーがアクセス可能なプロトタイプグループの一覧を取得します。
 *     responses:
 *       '200':
 *         description: アクセス可能なプロトタイプグループの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   prototypeGroup:
 *                     $ref: '#/components/schemas/PrototypeGroup'
 *                   prototypes:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Prototype'
 */
router.get('/', async (req: Request, res: Response) => {
  const user = req.user as UserModel;

  try {
    res.json(await getAccessiblePrototypes({ userId: user.id }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototype-groups:
 *   post:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループ作成
 *     description: 新しいプロトタイプグループを作成します。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       '201':
 *         description: 新しいプロトタイプグループを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrototypeGroup'
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

  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'プロトタイプ名が必要です' });
    return;
  }

  const transaction = await sequelize.transaction();
  try {
    const group = await createPrototypeGroup({
      userId: user.id,
      name,
      transaction,
    });

    await transaction.commit();
    res.status(201).json(group);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/version:
 *   post:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプバージョン作成
 *     description: 指定されたプロトタイプグループのプロトタイプバージョンを作成します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
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
 *               versionNumber:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプバージョンを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプグループが見つかりません
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
  '/:prototypeGroupId/version',
  checkPrototypeGroupAccess,
  async (req: Request, res: Response) => {
    const { name, versionNumber } = req.body;
    if (!name || !versionNumber) {
      res.status(400).json({
        error: 'プロトタイプ名、バージョン番号が必要です',
      });
      return;
    }

    const transaction = await sequelize.transaction();
    try {
      const newPrototype = await createPrototypeVersion({
        prototypeGroupId: req.params.prototypeGroupId,
        name,
        versionNumber,
        transaction,
      });

      await transaction.commit();
      res.status(201).json(newPrototype);
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/{prototypeVersionId}/instance:
 *   post:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプインスタンス作成
 *     description: 指定されたプロトタイプグループのプロトタイプインスタンスを作成します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
 *         schema:
 *           type: string
 *       - name: prototypeVersionId
 *         in: path
 *         required: true
 *         description: プロトタイプバージョンのID
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
 *               versionNumber:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプインスタンスを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプグループが見つかりません
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
  '/:prototypeGroupId/:prototypeVersionId/instance',
  checkPrototypeGroupAccess,
  async (req: Request, res: Response) => {
    const { name, versionNumber } = req.body;
    if (!name || !versionNumber) {
      res.status(400).json({
        error: 'プロトタイプ名、バージョン番号が必要です',
      });
      return;
    }

    const transaction = await sequelize.transaction();
    try {
      const newPrototype = await createPrototypeInstance({
        prototypeGroupId: req.params.prototypeGroupId,
        prototypeVersionId: req.params.prototypeVersionId,
        name,
        versionNumber,
        transaction,
      });

      await transaction.commit();
      res.status(201).json(newPrototype);
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}:
 *   get:
 *     tags: [PrototypeGroups]
 *     summary: 特定のグループに属するプロトタイプ一覧取得
 *     description: 指定されたIDのプロトタイプグループに属するプロトタイプの一覧を取得します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプグループに属するプロトタイプの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prototypeGroup:
 *                   $ref: '#/components/schemas/PrototypeGroup'
 *                 prototypes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプグループが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.get(
  '/:prototypeGroupId',
  checkPrototypeGroupAccess,
  async (req: Request, res: Response) => {
    const prototypeGroupId = req.params.prototypeGroupId;

    try {
      const prototypeGroup =
        await PrototypeGroupModel.findByPk(prototypeGroupId);
      if (!prototypeGroup) {
        res.status(404).json({ error: 'プロトタイプグループが見つかりません' });
        return;
      }

      const prototypes = await PrototypeModel.findAll({
        where: { prototypeGroupId },
      });

      res.json({
        prototypeGroup,
        prototypes,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}:
 *   delete:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループ削除
 *     description: 指定されたIDのプロトタイプグループを削除します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプグループを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロトタイプグループが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.delete(
  '/:prototypeGroupId',
  checkPrototypeGroupOwner,
  async (req: Request, res: Response) => {
    const prototypeGroupId = req.params.prototypeGroupId;

    try {
      const prototypeGroup =
        await PrototypeGroupModel.findByPk(prototypeGroupId);
      if (!prototypeGroup) {
        res.status(404).json({ error: 'プロトタイプグループが見つかりません' });
        return;
      }

      await PrototypeGroupModel.destroy({
        where: { id: prototypeGroupId },
      });

      res.json({ message: 'プロトタイプグループを削除しました' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/access-users:
 *   get:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループへのアクセス権を取得
 *     description: 指定されたプロトタイプグループにアクセス可能なユーザーを取得します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
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
  '/:prototypeGroupId/access-users',
  checkPrototypeGroupAccess,
  async (req: Request, res: Response) => {
    const prototypeGroupId = req.params.prototypeGroupId;

    try {
      res.json(await getAccessibleUsers({ prototypeGroupId }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/invite:
 *   post:
 *     tags: [PrototypeGroups]
 *     summary: ユーザーにプロトタイプへのアクセス権を付与
 *     description: 指定されたプロトタイプグループにユーザーを招待します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
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
router.post(
  '/:prototypeGroupId/invite',
  checkPrototypeGroupAccess,
  async (req, res) => {
    const prototypeGroupId = req.params.prototypeGroupId;
    const guestIds = req.body.guestIds;

    try {
      const access = await AccessModel.findOne({
        where: { prototypeGroupId },
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
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/invite/{guestId}:
 *   delete:
 *     tags: [PrototypeGroups]
 *     summary: ユーザーのアクセス権を削除
 *     description: 指定されたプロトタイプグループからユーザーのアクセス権を削除します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
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
  '/:prototypeGroupId/invite/:guestId',
  checkPrototypeGroupAccess,
  async (req, res) => {
    const prototypeGroupId = req.params.prototypeGroupId;
    const guestId = req.params.guestId;

    try {
      const prototypeGroup =
        await PrototypeGroupModel.findByPk(prototypeGroupId);
      if (!prototypeGroup) {
        throw new Error('プロトタイプグループが見つかりません');
      }

      if (prototypeGroup.userId === guestId) {
        res.status(400).json({ message: '作成者は削除できません' });
        return;
      }

      const access = await AccessModel.findOne({
        where: { prototypeGroupId },
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
 * /api/prototype-groups/{prototypeGroupId}/duplicate:
 *   post:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループの複製
 *     description: 指定されたプロトタイプグループを複製します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプグループを複製しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロトタイプグループが見つかりません
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
  '/:prototypeGroupId/duplicate',
  checkPrototypeGroupAccess,
  async (req, res) => {
    const prototypeGroupId = req.params.prototypeGroupId;

    try {
      // TODO: グループの複製
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

export default router;
