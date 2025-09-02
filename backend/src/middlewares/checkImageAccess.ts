import { Request, Response, NextFunction } from 'express';
import ImageModel from '../models/Image';
import PartPropertyModel from '../models/PartProperty';
import PartModel from '../models/Part';
import PrototypeModel from '../models/Prototype';
import type UserModel from '../models/User';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/CustomError';
import { hasPermission } from '../helpers/roleHelper';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '../const';

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

    // アップロードしたユーザーは常にアクセス可能
    if (image.uploaderUserId !== String(user.id)) {
      // 画像を利用しているプロジェクトを取得
      const partProperties = await PartPropertyModel.findAll({
        where: { imageId },
        include: [
          {
            model: PartModel,
            as: 'part',
            include: [PrototypeModel],
          },
        ],
      });

      const hasProjectAccess = await (async () => {
        for (const prop of partProperties) {
          const projectId = (prop as any).part?.Prototype?.projectId as
            | string
            | undefined;
          if (projectId) {
            const allowed = await hasPermission(
              String(user.id),
              RESOURCE_TYPES.PROJECT,
              PERMISSION_ACTIONS.READ,
              projectId
            );
            if (allowed) return true;
          }
        }
        return false;
      })();

      if (!hasProjectAccess) {
        throw new ForbiddenError('この画像にアクセスする権限がありません');
      }
    }

    res.locals.image = image;
    next();
  } catch (error) {
    next(error);
  }
};
