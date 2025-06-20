import { Request, Response, NextFunction } from 'express';
import PrototypeGroupModel from '../models/PrototypeGroup';
import UserModel from '../models/User';
import { hasPermission } from '../helpers/roleHelper';
import { RESOURCE_TYPES, PERMISSION_ACTIONS } from '../const';

/**
 * プロトタイプグループの作成者（所有者）かどうかを確認する
 * 注意: このミドルウェアはレガシー機能として残しています。
 * 新しいRBACシステムでは、admin権限でより細かい制御が可能です。
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkPrototypeGroupOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const prototypeGroupId = req.params.prototypeGroupId;
    // 対象プロトタイプグループ
    const targetPrototypeGroup =
      await PrototypeGroupModel.findByPk(prototypeGroupId);

    // プロトタイプグループの作成者の場合
    if (
      targetPrototypeGroup &&
      targetPrototypeGroup.userId === (req.user as UserModel).id
    ) {
      return next();
    }

    res
      .status(403)
      .json({ message: 'プロトタイプグループの作成者ではありません' });
    return;
  } catch (error) {
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    next(error);
    return;
  }
}

/**
 * プロトタイプグループへの読み取り権限を確認する（RBAC対応）
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkPrototypeGroupReadPermission(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req.user as UserModel).id;
  const prototypeGroupId = req.params.prototypeGroupId;

  try {
    // RBACシステムで読み取り権限をチェック
    const hasAccess = await hasPermission(
      userId,
      RESOURCE_TYPES.PROTOTYPE_GROUP,
      PERMISSION_ACTIONS.READ,
      prototypeGroupId
    );

    if (hasAccess) {
      return next();
    }

    res
      .status(403)
      .json({ message: 'プロトタイプグループへの読み取り権限がありません' });
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
  const userId = (req.user as UserModel).id;
  const prototypeId = req.params.prototypeId;

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
 * グループへの読み取り権限を確認する（RBAC対応）
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
  const userId = (req.user as UserModel).id;
  const groupId = req.params.groupId;

  try {
    // RBACシステムでグループへの読み取り権限をチェック
    const hasAccess = await hasPermission(
      userId,
      RESOURCE_TYPES.PROTOTYPE_GROUP,
      PERMISSION_ACTIONS.READ,
      groupId
    );

    if (hasAccess) {
      return next();
    }

    res.status(403).json({ message: 'グループへの読み取り権限がありません' });
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
 * @param resource - リソースタイプ（RESOURCE_TYPES.PROTOTYPE_GROUP, RESOURCE_TYPES.PROTOTYPE等）
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
    const userId = (req.user as UserModel).id;
    const resourceId = req.params[resourceIdParam];

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
 * プロトタイプグループの管理権限をチェック
 */
export const checkPrototypeGroupManagePermission = checkPermission(
  RESOURCE_TYPES.PROTOTYPE_GROUP,
  PERMISSION_ACTIONS.MANAGE,
  'prototypeGroupId'
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
 * プロトタイプのプレイ権限をチェック
 */
export const checkPrototypePlayPermission = checkPermission(
  RESOURCE_TYPES.PROTOTYPE,
  PERMISSION_ACTIONS.PLAY,
  'prototypeId'
);
