import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import ProjectModel from '../models/Project';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkProjectReadPermission,
  checkProjectManagePermission,
} from '../middlewares/authorization';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import sequelize from '../models';
import {
  createProject,
  createPrototypeVersion,
} from '../factories/prototypeFactory';
import { Op } from 'sequelize';
import { getAccessibleUsers } from '../helpers/userHelper';
import { assignRole } from '../helpers/roleHelper';
import { RESOURCE_TYPES, ROLE_TYPE } from '../const';
import RoleModel from '../models/Role';
import UserRoleModel from '../models/UserRole';
import { getProjectMembers } from '../helpers/userRoleHelper';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: プロジェクト一覧取得
 *     description: ユーザーがアクセス可能なプロジェクトの一覧を取得します。
 *     responses:
 *       '200':
 *         description: アクセス可能なプロジェクトの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   project:
 *                     $ref: '#/components/schemas/Project'
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
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: プロジェクト作成
 *     description: 新しいプロジェクトを作成します。
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
 *         description: 新しいプロジェクトを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
    const project = await createProject({
      userId: user.id,
      name,
      transaction,
    });

    await transaction.commit();
    res.status(201).json(project);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
});

/**
 * @swagger
 * /api/projects/{projectId}/version:
 *   post:
 *     tags: [Projects]
 *     summary: プロトタイプバージョン作成
 *     description: 指定されたプロジェクトのプロトタイプバージョンを作成します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
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
 *         description: プロジェクトが見つかりません
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
  '/:projectId/version',
  checkProjectReadPermission,
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
      // VERSION作成（MASTERコピー＋INSTANCEも同時作成）
      const { versionPrototype, instancePrototype } =
        await createPrototypeVersion({
          projectId: req.params.projectId,
          name,
          versionNumber,
          transaction,
        });
      await transaction.commit();
      res
        .status(201)
        .json({ version: versionPrototype, instance: instancePrototype });
    } catch (error) {
      await transaction.rollback();
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     tags: [Projects]
 *     summary: 特定のプロジェクトの詳細とプロトタイプ一覧取得
 *     description: 指定されたIDのプロジェクトの詳細情報と、そのプロジェクトに属するプロトタイプの一覧を取得します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロジェクトと関連するプロトタイプの情報を返します
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Project'
 *                 - type: object
 *                   properties:
 *                     prototypes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロジェクトが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.get(
  '/:projectId',
  checkProjectReadPermission,
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId;

    try {
      // スコープを使用してプロジェクトとプロトタイプを一緒に取得
      const project =
        await ProjectModel.scope('withPrototypes').findByPk(projectId);

      if (!project) {
        res.status(404).json({ error: 'プロジェクトが見つかりません' });
        return;
      }

      res.json(project.toJSON());
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     tags: [Projects]
 *     summary: プロジェクト削除
 *     description: 指定されたIDのプロジェクトを削除します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロジェクトを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロジェクトが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.delete(
  '/:projectId',
  checkProjectManagePermission,
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId;

    try {
      const project = await ProjectModel.findByPk(projectId);
      if (!project) {
        res.status(404).json({ error: 'プロジェクトが見つかりません' });
        return;
      }

      await ProjectModel.destroy({
        where: { id: projectId },
      });

      res.json({ message: 'プロジェクトを削除しました' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/access-users:
 *   get:
 *     tags: [Projects]
 *     summary: プロジェクトへのアクセス権を取得
 *     description: 指定されたプロジェクトにアクセス可能なユーザーを取得します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
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
  '/:projectId/access-users',
  checkProjectReadPermission,
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId;

    try {
      res.json(await getAccessibleUsers({ projectId }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/invite:
 *   post:
 *     tags: [Projects]
 *     summary: ユーザーにプロジェクトへのアクセス権を付与
 *     description: 指定されたプロジェクトにユーザーを招待します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
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
 *         description: プロジェクトが見つかりません
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
  '/:projectId/invite',
  checkProjectReadPermission,
  async (req, res) => {
    const projectId = req.params.projectId;
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
            RESOURCE_TYPES.PROJECT,
            projectId
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
 * /api/projects/{projectId}/invite/{guestId}:
 *   delete:
 *     tags: [Projects]
 *     summary: ユーザーのアクセス権を削除
 *     description: 指定されたプロジェクトからユーザーのアクセス権を削除します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
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
 *         description: プロジェクトが見つかりません
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
  '/:projectId/invite/:guestId',
  checkProjectReadPermission,
  async (req, res) => {
    const projectId = req.params.projectId;
    const guestId = req.params.guestId;

    try {
      const project = await ProjectModel.findByPk(projectId);
      if (!project) {
        throw new Error('プロジェクトが見つかりません');
      }

      if (project.userId === guestId) {
        res.status(400).json({ message: '作成者は削除できません' });
        return;
      }

      // すべてのロールを削除（このプロジェクトに対する）
      await UserRoleModel.destroy({
        where: {
          userId: guestId,
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
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
 * /api/projects/{projectId}/duplicate:
 *   post:
 *     tags: [Projects]
 *     summary: プロジェクトの複製
 *     description: 指定されたプロジェクトを複製します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロジェクトを複製しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロジェクトが見つかりません
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
  '/:projectId/duplicate',
  checkProjectReadPermission,
  async (req, res) => {
    // const projectId = req.params.projectId;

    try {
      // TODO: プロジェクトの複製
      res.status(501).json({ message: '未実装' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/members:
 *   get:
 *     tags: [Projects]
 *     summary: プロジェクトのメンバー一覧取得
 *     description: プロジェクトのメンバーとそのロールを取得します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
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
  '/:projectId/members',
  checkProjectReadPermission,
  async (req, res) => {
    const projectId = req.params.projectId;

    try {
      const members = await getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/roles:
 *   get:
 *     tags: [Projects]
 *     summary: プロジェクトのロール一覧取得
 *     description: プロジェクトのユーザーロール一覧を取得します。
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロジェクトのID
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
  '/:projectId/roles',
  checkProjectReadPermission,
  async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
      // UserRoleを関連データと共に取得（N+1問題を解決）
      const userRoles = await UserRoleModel.findAll({
        where: {
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
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

      // ユーザーごとにロールをまとめる
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
 * /api/projects/{projectId}/roles:
 *   post:
 *     tags: [Projects]
 *     summary: プロジェクトにロールを追加
 *     description: ユーザーにプロジェクトのロールを割り当てます。
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロジェクトのID
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
  '/:projectId/roles',
  checkProjectManagePermission,
  async (req: Request, res: Response) => {
    const { projectId } = req.params;
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
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
        },
      });
      if (existingRole) {
        res
          .status(409)
          .json({ error: 'ユーザーは既にこのロールを持っています' });
        return;
      }

      // ロールを割り当て
      await assignRole(userId, role.id, RESOURCE_TYPES.PROJECT, projectId);

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
 * /api/projects/{projectId}/roles/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: プロジェクトからロールを削除
 *     description: ユーザーからプロジェクトのロールを削除します。
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロジェクトのID
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
  '/:projectId/roles/:userId',
  checkProjectManagePermission,
  async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;

    try {
      // プロジェクトの作成者かチェック
      const project = await ProjectModel.findByPk(projectId);
      if (project && project.userId === userId) {
        res.status(400).json({
          error: 'プロジェクトの作成者のロールは削除できません',
        });
        return;
      }

      // 最後の管理者かチェック
      const adminRole = await RoleModel.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        const adminCount = await UserRoleModel.count({
          where: {
            roleId: adminRole.id,
            resourceType: RESOURCE_TYPES.PROJECT,
            resourceId: projectId,
          },
        });

        const userAdminRole = await UserRoleModel.findOne({
          where: {
            userId,
            roleId: adminRole.id,
            resourceType: RESOURCE_TYPES.PROJECT,
            resourceId: projectId,
          },
        });

        if (userAdminRole && adminCount <= 1) {
          res
            .status(400)
            .json({ error: '最後の管理者のロールは削除できません' });
          return;
        }
      }

      // ユーザーの全ロールを削除
      await UserRoleModel.destroy({
        where: {
          userId,
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
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

/**
 * @swagger
 * /api/projects/{projectId}/roles/{userId}:
 *   put:
 *     tags: [Projects]
 *     summary: プロジェクトのロールを更新
 *     description: ユーザーのプロジェクトロールを変更します。
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: プロジェクトのID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ユーザーのID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleName:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *     responses:
 *       '200':
 *         description: ロールが更新されました
 *       '400':
 *         description: リクエストが不正です
 *       '404':
 *         description: ユーザーまたはロールが見つかりません
 */
router.put(
  '/:projectId/roles/:userId',
  checkProjectManagePermission,
  async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      res.status(400).json({ error: 'ロール名は必須です' });
      return;
    }

    try {
      // ユーザーが存在するかチェック
      const user = await UserModel.findByPk(userId);
      if (!user) {
        res.status(404).json({ error: 'ユーザーが見つかりません' });
        return;
      }

      // 新しいロールが存在するかチェック
      const newRole = await RoleModel.findOne({
        where: { name: roleName },
      });
      if (!newRole) {
        res.status(404).json({ error: 'ロールが見つかりません' });
        return;
      }

      // プロジェクトの作成者の場合、管理者権限は変更不可
      const project = await ProjectModel.findByPk(projectId);
      if (project && project.userId === userId) {
        res.status(400).json({
          error: 'プロジェクトの作成者のロールは変更できません',
        });
        return;
      }

      // 現在のロールを取得
      const currentUserRoles = await UserRoleModel.findAll({
        where: {
          userId,
          resourceType: RESOURCE_TYPES.PROJECT,
          resourceId: projectId,
        },
        include: [{ model: RoleModel, as: 'Role' }],
      });

      if (currentUserRoles.length === 0) {
        res.status(404).json({
          error: 'ユーザーはこのプロジェクトのロールを持っていません',
        });
        return;
      }

      // 管理者ロールを変更する場合の特別チェック
      const adminRole = await RoleModel.findOne({ where: { name: 'admin' } });
      const hasAdminRole = currentUserRoles.some(
        (userRole) => userRole.Role && userRole.Role.name === 'admin'
      );

      if (hasAdminRole && roleName !== 'admin' && adminRole) {
        // 最後の管理者かチェック
        const adminCount = await UserRoleModel.count({
          where: {
            roleId: adminRole.id,
            resourceType: RESOURCE_TYPES.PROJECT,
            resourceId: projectId,
          },
        });

        if (adminCount <= 1) {
          res.status(400).json({
            error: '最後の管理者のロールは変更できません',
          });
          return;
        }
      }

      // 現在のロールがすでに新しいロールと同じかチェック
      const hasTargetRole = currentUserRoles.some(
        (userRole) => userRole.Role && userRole.Role.name === roleName
      );

      if (hasTargetRole) {
        res.status(400).json({
          error: 'ユーザーは既にこのロールを持っています',
        });
        return;
      }

      // トランザクションを使用してロールを更新
      await sequelize.transaction(async (transaction) => {
        // 既存のロールを削除
        await UserRoleModel.destroy({
          where: {
            userId,
            resourceType: RESOURCE_TYPES.PROJECT,
            resourceId: projectId,
          },
          transaction,
        });

        // 新しいロールを追加
        await UserRoleModel.create(
          {
            userId,
            roleId: newRole.id,
            resourceType: RESOURCE_TYPES.PROJECT,
            resourceId: projectId,
          },
          { transaction }
        );
      });

      res.json({
        message: `ユーザーのロールを${roleName}に更新しました`,
        userId,
        roleName,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

export default router;
