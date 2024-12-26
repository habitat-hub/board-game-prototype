import UserModel from '../models/User';
import AccessModel from '../models/Access';

/**
 * アクセス可能なユーザーを取得する
 *
 * @param groupId - グループID
 * @returns アクセス可能なユーザー
 */
export async function getAccessibleUsers({ groupId }: { groupId: string }) {
  const accessibleUsers = await UserModel.findAll({
    include: {
      model: AccessModel,
      where: { prototypeGroupId: groupId },
    },
  });

  return accessibleUsers;
}
