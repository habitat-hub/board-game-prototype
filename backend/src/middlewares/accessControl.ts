import { Request, Response, NextFunction } from 'express';
import PrototypeGroupModel from '../models/PrototypeGroup';
import UserModel from '../models/User';
import {
  getAccessiblePrototypeGroups,
  getAccessiblePrototypes,
} from '../helpers/prototypeHelper';
import AccessModel from '../models/Access';

/**
 * プロトタイプグループの作成者かどうかを確認する
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

    // プロトタイプの作成者の場合
    if (
      targetPrototypeGroup &&
      targetPrototypeGroup.userId === (req.user as UserModel).id
    ) {
      return next();
    }

    res.status(403).json({ message: 'プロトタイプの作成者ではありません' });
    return;
  } catch (error) {
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    next(error);
    return;
  }
}

/**
 * プロトタイプグループへのアクセス権を確認する
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkPrototypeGroupAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req.user as UserModel).id;

  try {
    const prototypeGroupId = req.params.prototypeGroupId;

    // アクセス可能なプロトタイプグループ
    const accessiblePrototypeGroups = await getAccessiblePrototypeGroups({
      userId,
    });
    // 対象のプロトタイプグループがアクセス可能な場合
    if (accessiblePrototypeGroups.some(({ id }) => id === prototypeGroupId)) {
      return next();
    }

    res
      .status(403)
      .json({ message: 'プロトタイプグループへのアクセス権がありません' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}

/**
 * プロトタイプへのアクセス権を確認する
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkPrototypeAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req.user as UserModel).id;

  try {
    const prototypeId = req.params.prototypeId;
    // アクセス可能なプロトタイプ
    const { prototypes } = await getAccessiblePrototypes({ userId });
    // 対象のプロトタイプがアクセス可能な場合
    if (prototypes.some(({ id }) => id === prototypeId)) {
      return next();
    }

    res.status(403).json({ message: 'プロトタイプへのアクセス権がありません' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}

/**
 * グループへのアクセス権を確認する
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkGroupAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req.user as UserModel).id;
  const groupId = req.params.groupId;

  try {
    // グループへのアクセス権を持つユーザー
    const userWithAccess = await UserModel.findOne({
      include: {
        model: AccessModel,
        where: { prototypeGroupId: groupId },
      },
      where: { id: userId },
    });

    // グループへのアクセス権を持つユーザーが存在しない場合
    if (!userWithAccess) {
      res.status(403).json({ message: 'グループへのアクセス権がありません' });
      return;
    }

    return next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}
