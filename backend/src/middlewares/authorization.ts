import { Request, Response, NextFunction } from 'express';
import ProjectModel from '../models/Project';
import UserModel from '../models/User';
import { hasPermission } from '../helpers/roleHelper';
import { RESOURCE_TYPES, PERMISSION_ACTIONS } from '../const';

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
      res.status(401).json({ message: '認証が必要です' });
      return;
    }

    if (!projectId) {
      res.status(400).json({ message: '必要なパラメータが不足しています' });
      return;
    }

    // 対象プロジェクト
    const targetProject = await ProjectModel.findByPk(projectId);

    // プロジェクトの作成者の場合
    if (targetProject && targetProject.userId === user.id) {
      return next();
    }

    res.status(403).json({ message: 'プロジェクトの作成者ではありません' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}

/**
 * プロジェクトへの読み取り権限を確認する（RBAC対応）
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkProjectReadPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as UserModel;
  const projectId = req.params.projectId;

  if (!user || !user.id) {
    res.status(401).json({ message: '認証が必要です' });
    return;
  }

  if (!projectId) {
    res.status(400).json({ message: '必要なパラメータが不足しています' });
    return;
  }

  const userId = user.id;

  try {
    // RBACシステムで読み取り権限をチェック
    const hasAccess = await hasPermission(
      userId,
      RESOURCE_TYPES.PROJECT,
      PERMISSION_ACTIONS.READ,
      projectId
    );

    if (hasAccess) {
      return next();
    }

    res
      .status(403)
      .json({ message: 'プロジェクトへの読み取り権限がありません' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}

/**
 * プロトタイプへの読み取り権限を確認する（RBAC対応）
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkPrototypeReadPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as UserModel;
  const prototypeId = req.params.prototypeId;

  if (!user || !user.id) {
    res.status(401).json({ message: '認証が必要です' });
    return;
  }

  if (!prototypeId) {
    res.status(400).json({ message: '必要なパラメータが不足しています' });
    return;
  }

  const userId = user.id;

  try {
    // RBACシステムで読み取り権限をチェック
    const hasAccess = await hasPermission(
      userId,
      RESOURCE_TYPES.PROTOTYPE,
      PERMISSION_ACTIONS.READ,
      prototypeId
    );

    if (hasAccess) {
      return next();
    }

    res
      .status(403)
      .json({ message: 'プロトタイプへの読み取り権限がありません' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}

/**
 * プロジェクトへの読み取り権限を確認する（RBAC対応）
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkGroupReadPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as UserModel;
  const projectId = req.params.projectId;

  if (!user || !user.id) {
    res.status(401).json({ message: '認証が必要です' });
    return;
  }

  if (!projectId) {
    res.status(400).json({ message: '必要なパラメータが不足しています' });
    return;
  }

  const userId = user.id;

  try {
    // RBACシステムでプロジェクトへの読み取り権限をチェック
    const hasAccess = await hasPermission(
      userId,
      RESOURCE_TYPES.PROJECT,
      PERMISSION_ACTIONS.READ,
      projectId
    );

    if (hasAccess) {
      return next();
    }

    res
      .status(403)
      .json({ message: 'プロジェクトへの読み取り権限がありません' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
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
  resource: string,
  action: string,
  resourceIdParam: string = 'resourceId'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as UserModel;
    const resourceId = req.params[resourceIdParam];

    if (!user || !user.id) {
      res.status(401).json({ message: '認証が必要です' });
      return;
    }

    if (!resourceId) {
      res.status(400).json({ message: '必要なパラメータが不足しています' });
      return;
    }

    const userId = user.id;

    try {
      const hasAccess = await hasPermission(
        userId,
        resource,
        action,
        resourceId
      );

      if (hasAccess) {
        return next();
      }

      res.status(403).json({
        message: `${resource}への${action}権限がありません`,
      });
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '予期せぬエラーが発生しました' });
      return;
    }
  };
}

/**
 * プロジェクトの管理権限をチェック
 */
export const checkProjectManagePermission = checkPermission(
  RESOURCE_TYPES.PROJECT,
  PERMISSION_ACTIONS.MANAGE,
  'projectId'
);

/**
 * プロトタイプの編集権限をチェック
 */
export const checkPrototypeWritePermission = checkPermission(
  RESOURCE_TYPES.PROTOTYPE,
  PERMISSION_ACTIONS.WRITE,
  'prototypeId'
);

/**
 * プロトタイプの削除権限をチェック
 */
export const checkPrototypeDeletePermission = checkPermission(
  RESOURCE_TYPES.PROTOTYPE,
  PERMISSION_ACTIONS.DELETE,
  'prototypeId'
);
