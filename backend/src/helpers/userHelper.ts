import UserModel from '../models/User';
import AccessModel from '../models/Access';

/**
 * アクセス可能なユーザーを取得する
 *
 * @param groupId - グループID
 * @returns アクセス可能なユーザー
 */
export async function getAccessibleUsers({
  prototypeGroupId,
}: {
  prototypeGroupId: string;
}) {
  // グループへのアクセス権を持つユーザー
  const accessibleUsers = await UserModel.findAll({
    include: {
      model: AccessModel,
      where: { prototypeGroupId },
    },
  });

  return accessibleUsers;
}
