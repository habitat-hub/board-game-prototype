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
import prototypeVersionRouter from './prototypeVersion';
import PrototypeVersionModel from '../models/PrototypeVersion';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

router.use('/versions', prototypeVersionRouter);

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
 * /api/prototypes/{prototypeId}/accessUsers:
 *   get:
 *     summary: プロトタイプへのアクセス権を取得
 *     description: 指定されたプロトタイプにアクセス可能なユーザーを取得します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
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
  '/:prototypeId/accessUsers',
  checkPrototypeAccess,
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;
    res.json(await getAccessibleUsers({ prototypeId }));
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

export default router;
