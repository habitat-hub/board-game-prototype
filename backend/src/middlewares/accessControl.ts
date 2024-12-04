import { Request, Response, NextFunction } from 'express';
import Access from '../models/Access';
import Prototype from '../models/Prototype';
import UserModel from '../models/User';

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
    const prototypeId = parseInt(req.params.prototypeId, 10);
    const prototype = await Prototype.findByPk(prototypeId);
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
    const prototypeId = parseInt(req.params.prototypeId, 10);
    const prototype = await Prototype.findByPk(prototypeId);
    if (prototype && prototype.userId === userId) {
      return next();
    }

    // アクセス権があるかどうかを確認
    const access = await Access.findOne({
      where: {
        userId,
        prototypeId,
      },
    });

    if (access) {
      return next();
    }

    res.status(403).json({ message: 'プロトタイプへのアクセス権がありません' });
    return;
  } catch (error) {
    res.status(500).json({ message: '予期せぬエラーが発生しました' });
    return;
  }
}
