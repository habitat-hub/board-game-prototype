import express, { Request, Response, NextFunction } from 'express';
import UserModel from '../models/User';
import ProjectModel from '../models/Project';
import PrototypeModel from '../models/Prototype';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkProjectReadPermission,
  checkProjectManagePermission,
  checkProjectAdminRole,
} from '../middlewares/permissions';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import sequelize from '../models';
import {
  createProject,
  createPrototypeVersion,
  duplicateProject,
} from '../factories/prototypeFactory';
import { Op } from 'sequelize';
import { getAccessibleUsers } from '../helpers/userHelper';
import { assignRole } from '../helpers/roleHelper';
import { RESOURCE_TYPES, ROLE_TYPE } from '../const';
import RoleModel from '../models/Role';
import UserRoleModel from '../models/UserRole';
import { getProjectMembers } from '../helpers/userRoleHelper';
import { validate } from '../middlewares/validators/validate';
import { projectCreationSchema } from '../middlewares/validators/project';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../errors/CustomError';

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
 *                       allOf:
 *                         - $ref: '#/components/schemas/Prototype'
 *                         - type: object
 *                           properties:
 *                             parts:
 *                               type: array
 *                               items:
 *                                 allOf:
 *                                   - $ref: '#/components/schemas/Part'
 *                                   - type: object
 *                                     properties:
 *                                       partProperties:
 *                                         type: array
 *                                         items:
 *                                           allOf:
 *                                             - $ref: '#/components/schemas/PartProperty'
 *                                             - type: object
 *                                               properties:
 *                                                 image:
 *                                                   $ref: '#/components/schemas/Image'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as UserModel;

  try {
    res.json(await getAccessiblePrototypes({ userId: user.id }));
  } catch (error) {
    next(error);
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
router.post(
  '/',
  validate(projectCreationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserModel;

    const { name } = req.body;

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
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/versions:
 *   post:
 *     tags: [Projects]
 *     summary: プロトタイプルーム作成
 *     description: 指定されたプロジェクトのプロトタイプルーム（VERSIONとINSTANCE）を作成します。
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
 *                 description: プロトタイプ名
 *             required:
 *               - name
 *     responses:
 *       '201':
 *         description: プロトタイプルームを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   $ref: '#/components/schemas/Prototype'
 *                 instance:
 *                   $ref: '#/components/schemas/Prototype'
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
router.post(
  '/:projectId/versions',
  checkProjectManagePermission,
  validate(projectCreationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    try {
      // VERSION作成（MASTERコピー＋INSTANCEも同時作成）
      const { versionPrototype, instancePrototype } =
        await sequelize.transaction(async (t) =>
          createPrototypeVersion({
            projectId: req.params.projectId,
            name,
            transaction: t,
          })
        );

      // Socket.IOでルーム作成を全ユーザーに通知
      try {
        const io = req.app.get('io');
        io.to(`project:${req.params.projectId}`).emit('ROOM_CREATED', {
          version: versionPrototype,
          instance: instancePrototype,
        });
      } catch (socketError) {
        console.warn('Socket.IO notification failed:', socketError);
        // Socket通信が失敗してもAPIのレスポンスは正常に返す
      }

      res
        .status(201)
        .json({ version: versionPrototype, instance: instancePrototype });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/projects/{projectId}/versions/{prototypeId}:
 *   delete:
 *     tags: [Projects]
 *     summary: プロトタイプルーム削除
 *     description: 指定されたプロジェクトのプロトタイプルーム（VERSIONとINSTANCE）を削除します。
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         description: プロジェクトのID
 *         schema:
 *           type: string
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: 削除するVERSIONプロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプルームを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロトタイプルームが見つかりません
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
  '/:projectId/versions/:prototypeId',
  checkProjectManagePermission,
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, prototypeId } = req.params;

    try {
      const { versionPrototype, deletedInstanceIds } =
        await sequelize.transaction(async (t) => {
          // 指定されたIDのVERSIONプロトタイプを取得
          const versionPrototype = await PrototypeModel.findOne({
            where: {
              id: prototypeId,
              projectId,
              type: 'VERSION',
            },
            transaction: t,
          });

          if (!versionPrototype) {
            throw new NotFoundError('プロトタイプルームが見つかりません');
          }

          // 関連するINSTANCEプロトタイプを取得（削除前にIDを記録）
          const instancePrototypes = await PrototypeModel.findAll({
            where: {
              projectId,
              type: 'INSTANCE',
              sourceVersionPrototypeId: versionPrototype.id,
            },
            attributes: ['id'],
            transaction: t,
          });

          const deletedInstanceIds = instancePrototypes.map(
            (p: PrototypeModel) => p.id
          );

          // INSTANCEプロトタイプを一括削除
          if (instancePrototypes.length > 0) {
            await PrototypeModel.destroy({
              where: {
                id: deletedInstanceIds,
              },
              transaction: t,
            });
          }

          // VERSIONプロトタイプを削除
          await PrototypeModel.destroy({
            where: { id: versionPrototype.id },
            transaction: t,
          });

          return { versionPrototype, deletedInstanceIds };
        });

      // Socket.IOでルーム削除を全ユーザーに通知
      try {
        const io = req.app.get('io');
        io.to(`project:${projectId}`).emit('ROOM_DELETED', {
          deletedVersionId: versionPrototype.id,
          deletedInstanceIds,
        });
      } catch (socketError) {
        console.warn('Socket.IO notification failed:', socketError);
        // Socket通信が失敗してもAPIのレスポンスは正常に返す
      }

      res.json({
        message: 'プロトタイプルームを削除しました',
        deletedVersion: versionPrototype.id,
        deletedInstances: deletedInstanceIds,
      });
    } catch (error) {
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;

    try {
      // スコープを使用してプロジェクトとプロトタイプを一緒に取得
      const project =
        await ProjectModel.scope('withPrototypes').findByPk(projectId);

      if (!project) {
        throw new NotFoundError('プロジェクトが見つかりません');
      }

      res.json(project.toJSON());
    } catch (error) {
      next(error);
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
  checkProjectAdminRole,
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;

    try {
      const project = await ProjectModel.findByPk(projectId);
      if (!project) {
        throw new NotFoundError('プロジェクトが見つかりません');
      }

      await ProjectModel.destroy({
        where: { id: projectId },
      });

      res.json({ message: 'プロジェクトを削除しました' });
    } catch (error) {
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;

    try {
      res.json(await getAccessibleUsers({ projectId }));
    } catch (error) {
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;
    const guestIds = req.body.guestIds;
    const roleType = req.body.roleType || ROLE_TYPE.EDITOR; // デフォルトはeditor

    // 有効なロールタイプかチェック
    const validRoleTypes = Object.values(ROLE_TYPE);
    if (!validRoleTypes.includes(roleType)) {
      return next(new ValidationError('無効なロールタイプが指定されました'));
    }

    try {
      // 指定されたロールを取得
      const role = await RoleModel.findOne({
        where: { name: roleType },
      });

      if (!role) {
        throw new NotFoundError('ロールが見つかりません');
      }

      const guests = await UserModel.findAll({
        where: { id: { [Op.in]: guestIds } },
      });
      if (guests.length === 0) {
        throw new NotFoundError('招待できるユーザーが見つかりません');
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
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;
    const guestId = req.params.guestId;

    try {
      const project = await ProjectModel.findByPk(projectId);
      if (!project) {
        throw new NotFoundError('プロジェクトが見つかりません');
      }

      if (project.userId === guestId) {
        throw new ValidationError('作成者は削除できません');
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
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserModel;
    const { projectId } = req.params;

    const transaction = await sequelize.transaction();
    try {
      const duplicated = await duplicateProject({
        projectId,
        userId: user.id,
        transaction,
      });

      await transaction.commit();
      res.json(duplicated);
    } catch (error) {
      await transaction.rollback();
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;

    try {
      const members = await getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      next(error);
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
  async (req: Request, res: Response, next: NextFunction) => {
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
      next(error);
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
  checkProjectAdminRole,
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { userId, roleName } = req.body;
    if (!userId || !roleName) {
      return next(new ValidationError('ユーザーIDとロール名は必須です'));
    }

    try {
      // ユーザーが存在するかチェック
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }

      // ロールが存在するかチェック
      const role = await RoleModel.findOne({
        where: { name: roleName },
      });
      if (!role) {
        throw new NotFoundError('ロールが見つかりません');
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
        throw new ConflictError('ユーザーは既にこのロールを持っています');
      }

      // ロールを割り当て
      await assignRole(userId, role.id, RESOURCE_TYPES.PROJECT, projectId);

      res.status(201).json({
        message: `ユーザーに${roleName}ロールを割り当てました`,
        userId,
        roleName,
      });
    } catch (error) {
      next(error);
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
  checkProjectAdminRole,
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, userId } = req.params;

    try {
      // プロジェクトの作成者かチェック
      const project = await ProjectModel.findByPk(projectId);
      if (project && project.userId === userId) {
        throw new ValidationError(
          'プロジェクトの作成者のロールは削除できません'
        );
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
          throw new ValidationError('最後の管理者のロールは削除できません');
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
      next(error);
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
  checkProjectAdminRole,
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, userId } = req.params;
    const { roleName } = req.body;

    if (!roleName) {
      return next(new ValidationError('ロール名は必須です'));
    }

    try {
      // ユーザーが存在するかチェック
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }

      // 新しいロールが存在するかチェック
      const newRole = await RoleModel.findOne({
        where: { name: roleName },
      });
      if (!newRole) {
        throw new NotFoundError('ロールが見つかりません');
      }

      // プロジェクトの作成者の場合、管理者権限は変更不可
      const project = await ProjectModel.findByPk(projectId);
      if (project && project.userId === userId) {
        throw new ValidationError(
          'プロジェクトの作成者のロールは変更できません'
        );
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
        throw new NotFoundError(
          'ユーザーはこのプロジェクトのロールを持っていません'
        );
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
          throw new ValidationError('最後の管理者のロールは変更できません');
        }
      }

      // 現在のロールがすでに新しいロールと同じかチェック
      const hasTargetRole = currentUserRoles.some(
        (userRole) => userRole.Role && userRole.Role.name === roleName
      );

      if (hasTargetRole) {
        throw new ValidationError('ユーザーは既にこのロールを持っています');
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
      next(error);
    }
  }
);

export default router;
