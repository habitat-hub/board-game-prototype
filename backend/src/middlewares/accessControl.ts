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
    // プロトタイプの作成者かどうかを確認
    const prototypeId = req.params.prototypeId;
    const prototype = await PrototypeModel.findByPk(prototypeId);
    if (prototype && prototype.userId === (req.user as UserModel).id) {
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
    // プロトタイプの作成者かどうかを確認
    const prototypeId = req.params.prototypeId;
    const accessiblePrototypes = await getAccessiblePrototypes({ userId });
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
    const user = await UserModel.findOne({
      include: {
        model: AccessModel,
        where: { prototypeGroupId: groupId },
      },
      where: { id: userId },
    });

    if (!user) {
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
