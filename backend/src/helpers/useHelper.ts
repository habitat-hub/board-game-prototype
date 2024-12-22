import UserModel from '../models/User';
import PrototypeGroupModel from '../models/PrototypeGroup';
import AccessModel from '../models/Access';

/**
 * アクセス可能なユーザーを取得する
 *
 * @param prototypeId - プロトタイプID
 * @returns アクセス可能なユーザー
 */
export async function getAccessibleUsers({
  prototypeId,
}: {
  prototypeId: string;
}) {
  const prototypeGroup = await PrototypeGroupModel.findOne({
    where: { prototypeId },
  });
  if (!prototypeGroup) {
    return [];
  }

  const accessibleUsers = await UserModel.findAll({
    include: {
      model: AccessModel,
      where: { prototypeGroupId: prototypeGroup.id },
    },
  });

  return accessibleUsers;
}
