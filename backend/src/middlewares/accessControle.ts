import { Request, Response, NextFunction } from 'express';
import Access from '../models/Access';
import Prototype from '../models/Prototype';
import UserModel from '../models/User';

export async function checkPrototypeOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { prototypeId } = req.params;

  try {
    // プロトタイプの作成者かどうかを確認
    const prototype = await Prototype.findByPk(prototypeId);
    if (prototype && prototype.userId === (req.user as UserModel).id) {
      return next();
    }

    res.status(403).json({ message: 'Forbidden: No access to this prototype' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
    next(error);
    return;
  }
}

export async function checkPrototypeAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { prototypeId } = req.params;
  const userId = (req.user as UserModel).id;

  try {
    // プロトタイプの作成者かどうかを確認
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

    res.status(403).json({ message: 'Forbidden: No access to this prototype' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
}
