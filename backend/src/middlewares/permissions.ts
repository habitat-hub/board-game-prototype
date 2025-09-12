import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ProjectModel from '../models/Project';
import UserRoleModel from '../models/UserRole';
import RoleModel from '../models/Role';
// 型のみ利用（ランタイム依存を避ける）
import type UserModel from '../models/User';
import { hasPermission } from '../helpers/roleHelper';
import {
  RESOURCE_TYPES,
  PERMISSION_ACTIONS,
  ROLE_TYPE,
  type ResourceType,
  type PermissionAction,
} from '../const';

/**
 * Express の非同期ミドルウェア型
 */
export type AsyncMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

function validateUser(req: Request, res: Response): UserModel | undefined {
  const user = req.user as UserModel;
  if (!user || !user.id) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: '認証が必要です' });
    return undefined;
  }
  return user;
}

function validateParam(
  req: Request,
  res: Response,
  paramName: string
): string | undefined {
  const value = req.params[paramName];
  if (!value) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: '必要なパラメータが不足しています',
    });
    return undefined;
  }
  return value;
}

/**
 * プロジェクトの作成者（所有者）かどうかを確認する
 * 注意: このミドルウェアはレガシー機能として残しています。
 * 新しいRBACシステムでは、admin権限でより細かい制御が可能です。
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkProjectOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = validateUser(req, res);
    if (!user) {
      return;
    }

    const projectId = validateParam(req, res, 'projectId');
    if (!projectId) {
      return;
    }

    // 対象プロジェクト
    const targetProject = await ProjectModel.findByPk(projectId);

    // プロジェクトの作成者の場合
    if (targetProject && targetProject.userId === user.id) {
      return next();
    }

    res
      .status(StatusCodes.FORBIDDEN)
      .json({ message: 'プロジェクトの作成者ではありません' });
    return;
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}

/**
 * プロジェクトのAdminロールを持っているか確認する
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェア
 */
export async function checkProjectAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = validateUser(req, res);
    if (!user) {
      return;
    }

    const projectId = validateParam(req, res, 'projectId');
    if (!projectId) {
      return;
    }

    const adminRole = await UserRoleModel.findOne({
      where: {
        userId: String(user.id),
        resourceType: RESOURCE_TYPES.PROJECT,
        resourceId: projectId,
      },
      include: [
        {
          model: RoleModel,
          as: 'Role',
          where: { name: ROLE_TYPE.ADMIN },
          required: true,
        },
      ],
    });

    if (!adminRole) {
      res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Adminロールが必要です' });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: '予期せぬエラーが発生しました' });
  }
}
/**
 * 特定の権限をチェックするミドルウェアファクトリー（RBAC対応）
 * このファクトリー関数は、指定されたリソースタイプとアクションに対する権限をチェックする
 * ミドルウェア関数を動的に生成します。
 *
 * @param resource - リソースタイプ（RESOURCE_TYPES.PROJECT, RESOURCE_TYPES.PROTOTYPE等）
 * @param action - アクション（PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE等）
 * @param resourceIdParam - リソースIDのパラメータ名（デフォルト: resourceId）
 * @returns 権限チェックを行うミドルウェア関数
 *
 * 使用例:
 * const checkReadPermission = checkPermission(RESOURCE_TYPES.PROTOTYPE, PERMISSION_ACTIONS.READ, 'prototypeId');
 */
export function checkPermission(
  resource: ResourceType,
  action: PermissionAction,
  resourceIdParam: string = 'resourceId'
): AsyncMiddleware {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = validateUser(req, res);
    if (!user) {
      return;
    }

    const resourceId = validateParam(req, res, resourceIdParam);
    if (!resourceId) {
      return;
    }

    const userId: string = String(user.id);

    try {
      const hasAccess: boolean = await hasPermission(
        userId,
        resource,
        action,
        resourceId
      );

      // 権限がある場合
      if (hasAccess) {
        next();
        return;
      }

      res.status(StatusCodes.FORBIDDEN).json({
        message: `${resource}への${action}権限がありません`,
      });
      return;
    } catch (error) {
      console.error(error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: '予期せぬエラーが発生しました' });
      return;
    }
  };
}

/**
 * プロジェクトの読み取り権限ミドルウェア
 * @returns Express ミドルウェア
 */
export const checkProjectReadPermission: AsyncMiddleware = checkPermission(
  RESOURCE_TYPES.PROJECT,
  PERMISSION_ACTIONS.READ,
  'projectId'
);

/**
 * プロジェクトの書き込み権限ミドルウェア
 * @returns Express ミドルウェア
 */
export const checkProjectWritePermission: AsyncMiddleware = checkPermission(
  RESOURCE_TYPES.PROJECT,
  PERMISSION_ACTIONS.WRITE,
  'projectId'
);

/**
 * プロトタイプの読み取り権限ミドルウェア
 * @returns Express ミドルウェア
 */
export const checkPrototypeReadPermission: AsyncMiddleware = checkPermission(
  RESOURCE_TYPES.PROTOTYPE,
  PERMISSION_ACTIONS.READ,
  'prototypeId'
);

/**
 * プロジェクトの管理権限ミドルウェア
 * @returns Express ミドルウェア
 */
export const checkProjectManagePermission: AsyncMiddleware = checkPermission(
  RESOURCE_TYPES.PROJECT,
  PERMISSION_ACTIONS.MANAGE,
  'projectId'
);

/**
 * プロトタイプの編集権限ミドルウェア
 * @returns Express ミドルウェア
 */
export const checkPrototypeWritePermission: AsyncMiddleware = checkPermission(
  RESOURCE_TYPES.PROTOTYPE,
  PERMISSION_ACTIONS.WRITE,
  'prototypeId'
);

/**
 * プロトタイプの削除権限ミドルウェア
 * @returns Express ミドルウェア
 */
export const checkPrototypeDeletePermission: AsyncMiddleware = checkPermission(
  RESOURCE_TYPES.PROTOTYPE,
  PERMISSION_ACTIONS.DELETE,
  'prototypeId'
);
