import UserModel from '../models/User';
import RoleModel from '../models/Role';
import { RESOURCE_TYPES, ROLE_TYPE } from '../const';

/**
 * アクセス可能なユーザーを取得する
 * 暫定的にadminロールを持つユーザーのみを返す
 *
 * @param prototypeGroupId - グループID
 * @returns アクセス可能なユーザー
 */
export async function getAccessibleUsers({
  prototypeGroupId,
}: {
  prototypeGroupId: string;
}) {
  // adminロールを持つユーザーを取得
  const accessibleUsers = await UserModel.findAll({
    include: [
      {
        model: RoleModel,
        as: 'roles',
        through: {
          where: {
            resourceType: RESOURCE_TYPES.PROTOTYPE_GROUP,
            resourceId: prototypeGroupId,
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
