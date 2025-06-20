import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import PrototypeGroupModel from '../models/PrototypeGroup';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkPrototypeGroupReadPermission,
  checkPrototypeGroupManagePermission,
} from '../middlewares/authorization';
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
import { assignRole } from '../helpers/roleHelper';
import { RESOURCE_TYPES, ROLE_TYPE } from '../const';
import RoleModel from '../models/Role';
import UserRoleModel from '../models/UserRole';
import { getPrototypeGroupMembers } from '../helpers/userRoleHelper';

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
  checkPrototypeGroupReadPermission,
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
  checkPrototypeGroupReadPermission,
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
  checkPrototypeGroupReadPermission,
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
  checkPrototypeGroupManagePermission,
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
  checkPrototypeGroupReadPermission,
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
 *                 description: 招待するユーザーのIDリスト
 *               roleType:
 *                 type: string
 *                 enum: ['admin', 'editor', 'viewer']
 *                 default: 'editor'
 *                 description: "付与するロールタイプ（admin：管理者、editor：編集者、viewer：閲覧者）"
 *     responses:
 *       '200':
 *         description: ユーザーを招待しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         description: リクエストが不正です（無効なロールタイプまたは無効なロールが指定された場合）
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
  checkPrototypeGroupReadPermission,
  async (req, res) => {
    const prototypeGroupId = req.params.prototypeGroupId;
    const guestIds = req.body.guestIds;
    const roleType = req.body.roleType || ROLE_TYPE.EDITOR; // デフォルトはeditor

    // 有効なロールタイプかチェック
    const validRoleTypes = Object.values(ROLE_TYPE);
    if (!validRoleTypes.includes(roleType)) {
      res.status(400).json({ message: '無効なロールタイプが指定されました' });
      return;
    }

    try {
      // 指定されたロールを取得
      const role = await RoleModel.findOne({
        where: { name: roleType },
      });

      if (!role) {
        res.status(400).json({ message: '無効なロールが指定されました' });
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
          await assignRole(
            guest.id,
            role.id,
            RESOURCE_TYPES.PROTOTYPE_GROUP,
            prototypeGroupId
          );
        })
      );

      res.status(200).json({
        message: `ユーザーを${roleType}ロールで招待しました`,
        assignedRole: roleType,
      });
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
  checkPrototypeGroupReadPermission,
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

      // すべてのロールを削除（このプロトタイプグループに対する）
      await UserRoleModel.destroy({
        where: {
          userId: guestId,
          resourceType: RESOURCE_TYPES.PROTOTYPE_GROUP,
          resourceId: prototypeGroupId,
        },
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
  checkPrototypeGroupReadPermission,
  async (req, res) => {
    // const prototypeGroupId = req.params.prototypeGroupId;

    try {
      // TODO: グループの複製
      res.status(501).json({ message: '未実装' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/members:
 *   get:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループのメンバー一覧取得
 *     description: プロトタイプグループのメンバーとそのロールを取得します。
 *     parameters:
 *       - name: prototypeGroupId
 *         in: path
 *         required: true
 *         description: プロトタイプグループのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: メンバー一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 */
router.get(
  '/:prototypeGroupId/members',
  checkPrototypeGroupReadPermission,
  async (req, res) => {
    const prototypeGroupId = req.params.prototypeGroupId;

    try {
      const members = await getPrototypeGroupMembers(prototypeGroupId);
      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/roles:
 *   get:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループのロール一覧取得
 *     description: プロトタイプグループのユーザーロール一覧を取得します。
 *     parameters:
 *       - in: path
 *         name: prototypeGroupId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロトタイプグループのID
 *     responses:
 *       '200':
 *         description: ロール一覧
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   user:
 *                     $ref: '#/components/schemas/User'
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 */
router.get(
  '/:prototypeGroupId/roles',
  checkPrototypeGroupReadPermission,
  async (req: Request, res: Response) => {
    const { prototypeGroupId } = req.params;

    try {
      // UserRoleを関連データと共に取得（N+1問題を解決）
      const userRoles = await UserRoleModel.findAll({
        where: {
          resourceType: RESOURCE_TYPES.PROTOTYPE_GROUP,
          resourceId: prototypeGroupId,
        },
        include: [
          {
            model: UserModel,
            as: 'User',
            attributes: ['id', 'username'],
          },
          {
            model: RoleModel,
            as: 'Role',
            attributes: ['name', 'description'],
          },
        ],
      });

      // ユーザーごとにロールをグループ化
      const roleMap = new Map();
      userRoles.forEach((userRole) => {
        // 関連データが存在することを確認
        if (!userRole.User || !userRole.Role) {
          console.warn(
            'UserRole record missing associated User or Role data:',
            userRole
          );
          return;
        }

        const userId = userRole.User.id;
        if (!roleMap.has(userId)) {
          roleMap.set(userId, {
            userId,
            user: {
              id: userRole.User.id,
              username: userRole.User.username,
            },
            roles: [],
          });
        }
        roleMap.get(userId).roles.push({
          name: userRole.Role.name,
          description: userRole.Role.description,
        });
      });

      res.json(Array.from(roleMap.values()));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/roles:
 *   post:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループにロールを追加
 *     description: ユーザーにプロトタイプグループのロールを割り当てます。
 *     parameters:
 *       - in: path
 *         name: prototypeGroupId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロトタイプグループのID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleName:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *     responses:
 *       '201':
 *         description: ロールが追加されました
 *       '400':
 *         description: リクエストが不正です
 *       '404':
 *         description: ユーザーまたはロールが見つかりません
 *       '409':
 *         description: ユーザーは既にこのロールを持っています
 */
router.post(
  '/:prototypeGroupId/roles',
  checkPrototypeGroupManagePermission,
  async (req: Request, res: Response) => {
    const { prototypeGroupId } = req.params;
    const { userId, roleName } = req.body;

    if (!userId || !roleName) {
      res.status(400).json({ error: 'ユーザーIDとロール名は必須です' });
      return;
    }

    try {
      // ユーザーが存在するかチェック
      const user = await UserModel.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'ユーザーが見つかりません' });
        return;
      }

      // ロールが存在するかチェック
      const role = await RoleModel.findOne({
        where: { name: roleName },
      });
      if (!role) {
        res.status(404).json({ error: 'ロールが見つかりません' });
        return;
      }

      // 既存のロール割り当てをチェック
      const existingRole = await UserRoleModel.findOne({
        where: {
          userId,
          roleId: role.id,
          resourceType: RESOURCE_TYPES.PROTOTYPE_GROUP,
          resourceId: prototypeGroupId,
        },
      });
      if (existingRole) {
        res
          .status(409)
          .json({ error: 'ユーザーは既にこのロールを持っています' });
        return;
      }

      // ロールを割り当て
      await assignRole(
        userId,
        role.id,
        RESOURCE_TYPES.PROTOTYPE_GROUP,
        prototypeGroupId
      );

      res.status(201).json({
        message: `ユーザーに${roleName}ロールを割り当てました`,
        userId,
        roleName,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/prototype-groups/{prototypeGroupId}/roles/{userId}:
 *   delete:
 *     tags: [PrototypeGroups]
 *     summary: プロトタイプグループからロールを削除
 *     description: ユーザーからプロトタイプグループのロールを削除します。
 *     parameters:
 *       - in: path
 *         name: prototypeGroupId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロトタイプグループのID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ユーザーのID
 *     responses:
 *       '200':
 *         description: ロールが削除されました
 *       '404':
 *         description: ユーザーまたはロールが見つかりません
 */
router.delete(
  '/:prototypeGroupId/roles/:userId',
  checkPrototypeGroupManagePermission,
  async (req: Request, res: Response) => {
    const { prototypeGroupId, userId } = req.params;

    try {
      // ユーザーの全ロールを削除
      await UserRoleModel.destroy({
        where: {
          userId,
          resourceType: RESOURCE_TYPES.PROTOTYPE_GROUP,
          resourceId: prototypeGroupId,
        },
      });

      res.json({
        message: 'ユーザーのロールを削除しました',
        userId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

export default router;
