import { Request, Response, NextFunction } from 'express';
import ImageModel from '../models/Image';
import type UserModel from '../models/User';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/CustomError';

export const checkImageAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as UserModel | undefined;
    const { imageId } = req.params;

    if (!user) {
      throw new UnauthorizedError('認証されていないユーザーです');
    }

    if (!imageId) {
      throw new ValidationError('Image ID が指定されていません');
    }

    const image = await ImageModel.findByPk(imageId);
    if (!image) {
      throw new NotFoundError('指定された画像が存在しません');
    }

    if (image.uploaderUserId !== String(user.id)) {
      throw new ForbiddenError('この画像にアクセスする権限がありません');
    }

    res.locals.image = image;
    next();
  } catch (error) {
    next(error);
  }
};
