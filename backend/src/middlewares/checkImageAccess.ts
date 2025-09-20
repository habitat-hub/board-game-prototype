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
import { getAccessibleResourceIds } from '../helpers/roleHelper';
import { PERMISSION_ACTIONS, RESOURCE_TYPES } from '../const';

/** PartProperty に紐づく Part/Prototype の最小限の型（アクセス判定に必要な項目のみ） */
type PartPropertyWithPartAndPrototype = {
  part?: {
    Prototype?: {
      projectId: string | number;
    };
  };
};

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
      const partProperties = (await PartPropertyModel.findAll({
        where: { imageId },
        include: [
          {
            model: PartModel,
            as: 'part',
            include: [PrototypeModel],
          },
        ],
      })) as PartPropertyWithPartAndPrototype[];

      const projectIds = Array.from(
        new Set(
          partProperties
            .map((prop) => prop.part?.Prototype?.projectId)
            .filter(
              (projectId): projectId is string | number =>
                projectId !== undefined && projectId !== null
            )
            .map((projectId) => String(projectId))
        )
      );

      const accessibleProjectIds =
        projectIds.length > 0
          ? await getAccessibleResourceIds(
              String(user.id),
              RESOURCE_TYPES.PROJECT,
              PERMISSION_ACTIONS.READ
            )
          : [];
      const accessibleProjectIdSet = new Set(accessibleProjectIds);
      const hasProjectAccess =
        projectIds.length > 0 &&
        projectIds.some((projectId) => accessibleProjectIdSet.has(projectId));

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
