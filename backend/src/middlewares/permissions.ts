import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ProjectModel from '../models/Project';
// 型のみ利用（ランタイム依存を避ける）
import type UserModel from '../models/User';
import { hasPermission } from '../helpers/roleHelper';
import {
  RESOURCE_TYPES,
  PERMISSION_ACTIONS,
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
    const user = req.user as UserModel;
    const projectId = req.params.projectId;

    if (!user || !user.id) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: '認証が必要です' });
      return;
    }

    if (!projectId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: '必要なパラメータが不足しています' });
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
    const user = req.user as UserModel;
    const resourceId: string | undefined = req.params[resourceIdParam];

    // 未認証の場合
    if (!user || !user.id) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: '認証が必要です' });
      return;
    }

    // 必須パラメータが不足している場合
    if (!resourceId) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: '必要なパラメータが不足しています' });
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
