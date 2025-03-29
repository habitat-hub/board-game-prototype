import { Request, Response, NextFunction } from 'express';
import PrototypeModel from '../models/Prototype';
import UserModel from '../models/User';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import AccessModel from '../models/Access';

/**
 * プロトタイプの作成者かどうかを確認する
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export async function checkPrototypeOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const prototypeId = req.params.prototypeId;
    // 対象プロトタイプ
    const targetPrototype = await PrototypeModel.findByPk(prototypeId);

    // プロトタイプの作成者の場合
    if (
      targetPrototype &&
      targetPrototype.userId === (req.user as UserModel).id
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
    const accessiblePrototypes = await getAccessiblePrototypes({ userId });
    // 対象のプロトタイプがアクセス可能な場合
    if (
      accessiblePrototypes.some((prototype) => prototype.id === prototypeId)
    ) {
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
