import UserModel from '../models/User';
import RoleModel from '../models/Role';
import ProjectModel from '../models/Project';
import PrototypeModel from '../models/Prototype';
import PartModel from '../models/Part';
import { RESOURCE_TYPES, ROLE_TYPE } from '../const';
import { NEED_TUTORIAL_PART_THRESHOLD } from '../constants/user';
import { QueryTypes } from 'sequelize';

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
 * - プロジェクトが1件 -> そのプロジェクト配下の Part 数が NEED_TUTORIAL_PART_THRESHOLD 以下 -> true
 */
export async function getNeedTutorial({ userId }: { userId: string }) {
  const sequelize = ProjectModel.sequelize;

  if (sequelize) {
    const sql = `
      SELECT
        (SELECT COUNT(1) FROM "Projects" p WHERE p."userId" = :userId) AS "projectCount",
        (SELECT COUNT(1) FROM "Parts" pa
           JOIN "Prototypes" pr ON pr."id" = pa."prototypeId"
           WHERE pr."projectId" IN (
             SELECT p2."id" FROM "Projects" p2 WHERE p2."userId" = :userId
           )
        ) AS "partCount"
    `;

    const results = (await sequelize.query(sql, {
      replacements: { userId },
      type: QueryTypes.SELECT,
      plain: true,
    })) as { projectCount: number; partCount: number } | null;

    const projectCount = results ? Number(results.projectCount) : 0;
    const partCount = results ? Number(results.partCount) : 0;

    if (projectCount === 0) return true;
    if (projectCount > 1) return false;
    return partCount <= NEED_TUTORIAL_PART_THRESHOLD;
  }

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

  return partCount <= NEED_TUTORIAL_PART_THRESHOLD;
}
