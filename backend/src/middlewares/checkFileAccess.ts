import { Request, Response, NextFunction } from 'express';
import FileModel from '../models/File';
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

/** PartProperty に紐づく Part/Prototype の最小限の型（アクセス判定に必要な項目のみ） */
type PartPropertyWithPartAndPrototype = {
  part?: {
    Prototype?: {
      projectId: string | number;
    };
  };
};

export const checkFileAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as UserModel | undefined;
    const { fileId } = req.params;

    if (!user) {
      throw new UnauthorizedError('認証されていないユーザーです');
    }

    if (!fileId) {
      throw new ValidationError('File ID が指定されていません');
    }

    const file = await FileModel.findByPk(fileId);
    if (!file) {
      throw new NotFoundError('指定されたファイルが存在しません');
    }

    // アップロードしたユーザーは常にアクセス可能
    if (file.uploaderUserId !== String(user.id)) {
      // ファイルを利用しているプロジェクトを取得
      const partProperties = (await PartPropertyModel.findAll({
        where: { fileId },
        include: [
          {
            model: PartModel,
            as: 'part',
            include: [PrototypeModel],
          },
        ],
      })) as PartPropertyWithPartAndPrototype[];

      const hasProjectAccess = await (async () => {
        for (const prop of partProperties) {
          const projectId = prop.part?.Prototype?.projectId;
          if (projectId) {
            const allowed = await hasPermission(
              String(user.id),
              RESOURCE_TYPES.PROJECT,
              PERMISSION_ACTIONS.READ,
              String(projectId)
            );
            if (allowed) return true;
          }
        }
        return false;
      })();

      if (!hasProjectAccess) {
        throw new ForbiddenError('このファイルにアクセスする権限がありません');
      }
    }

    res.locals.file = file;
    next();
  } catch (error) {
    next(error);
  }
};
