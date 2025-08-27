import UserModel from '../models/User';
import RoleModel from '../models/Role';
import ProjectModel from '../models/Project';
import PrototypeModel from '../models/Prototype';
import PartModel from '../models/Part';
import { RESOURCE_TYPES, ROLE_TYPE } from '../const';

/**
 * アクセス可能なユーザーを取得する
 * 暫定的にadminロールを持つユーザーのみを返す
 *
 * @param projectId - プロジェクトID
 * @returns アクセス可能なユーザー
 */
export async function getAccessibleUsers({ projectId }: { projectId: string }) {
  // adminロールを持つユーザーを取得
  const accessibleUsers = await UserModel.findAll({
    include: [
      {
        model: RoleModel,
        as: 'roles',
        through: {
          where: {
            resourceType: RESOURCE_TYPES.PROJECT,
            resourceId: projectId,
          },
        },
        where: {
          name: ROLE_TYPE.ADMIN,
        },
        required: true,
      },
    ],
    attributes: ['id', 'username'],
  });

  return accessibleUsers;
}

/**
 * 指定ユーザーがチュートリアルを表示すべきか判定する
 * 既存のルートから切り出したロジック。
 *
 * ルール:
 * - プロジェクトが0件 -> true
 * - プロジェクトが2件以上 -> false
 * - プロジェクトが1件 -> そのプロジェクト配下の Part 数が 20 以下 -> true
 */
export async function getNeedTutorial({ userId }: { userId: string }) {
  const projectCount = await ProjectModel.count({ where: { userId } });

  if (projectCount === 0) {
    return true;
  }

  if (projectCount > 1) {
    return false;
  }

  const project = await ProjectModel.findOne({ where: { userId } });

  if (!project) {
    return false;
  }

  const partCount = await PartModel.count({
    include: [
      {
        model: PrototypeModel,
        where: { projectId: project.id },
      },
    ],
  });

  return partCount <= 20;
}
