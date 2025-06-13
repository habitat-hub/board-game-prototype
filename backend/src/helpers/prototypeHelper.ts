import { Op } from 'sequelize';
import AccessModel from '../models/Access';
import PartModel from '../models/Part';
import PrototypeGroupModel from '../models/PrototypeGroup';
import UserModel from '../models/User';
import PrototypeModel from '../models/Prototype';

/**
 * アクセス可能なプロトタイプグループを取得する
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロトタイプグループ
 */
export async function getAccessiblePrototypeGroups({
  userId,
}: {
  userId: string;
}) {
  // アクセス権
  const accesses = await AccessModel.findAll({
    include: {
      model: UserModel,
      where: { id: userId },
    },
  });
  // アクセス可能なグループID
  const accessibleGroupIds = accesses.map((access) => access.prototypeGroupId);
  // アクセス可能なプロトタイプグループ
  return await PrototypeGroupModel.findAll({
    where: { id: { [Op.in]: accessibleGroupIds } },
  });
}

/**
 * アクセス可能なプロトタイプを取得する
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロトタイプ
 */
export async function getAccessiblePrototypes({ userId }: { userId: string }) {
  const prototypeGroups = await getAccessiblePrototypeGroups({ userId });

  const prototypes = await PrototypeModel.findAll({
    where: {
      prototypeGroupId: { [Op.in]: prototypeGroups.map(({ id }) => id) },
    },
  });

  return prototypeGroups.map((prototypeGroup) => {
    return {
      prototypeGroup,
      prototypes: prototypes.filter(
        ({ prototypeGroupId }) => prototypeGroupId === prototypeGroup.id
      ),
    };
  });
}

/**
 * パーツが重なっているかどうかを判定する
 * @param selfPart - 自分のパーツ
 * @param part - パーツ
 * @returns 重なっているかどうか
 */
export function isOverlapping(selfPart: PartModel, part: PartModel) {
  return (
    selfPart.position.x < part.position.x + part.width &&
    selfPart.position.x + selfPart.width > part.position.x &&
    selfPart.position.y < part.position.y + part.height &&
    selfPart.position.y + selfPart.height > part.position.y
  );
}

/**
 * 自分の上にあるパーツを取得する
 * @param partId - パーツID
 * @param sortedParts - ソート済みのパーツ(order: 昇順)
 * @returns 自分の上にあるパーツ
 */
export async function getOverLappingPart(
  partId: number,
  sortedParts: PartModel[]
) {
  // 対象パーツ
  const selfPart = sortedParts.find((part) => part.id === partId);
  // 対象パーツが存在しない場合
  if (!selfPart) return;

  // 自分の上にあるパーツ
  return sortedParts.find(
    (part) => part.order > selfPart.order && isOverlapping(selfPart, part)
  );
}

/**
 * 自分の下にあるパーツを取得する
 * @param partId - パーツID
 * @param sortedParts - ソート済みのパーツ(order: 昇順)
 * @returns 自分の下にあるパーツ
 */
export async function getUnderLappingPart(
  partId: number,
  sortedParts: PartModel[]
) {
  // 対象パーツ
  const selfPart = sortedParts.find((part) => part.id === partId);
  // 対象パーツが存在しない場合
  if (!selfPart) return;

  // 自分の下にあるパーツ
  return sortedParts.find(
    (part) => part.order < selfPart.order && isOverlapping(selfPart, part)
  );
}

/**
 * デッキをシャッフルする
 * @param cards - シャッフルするパーツ
 */
export async function shuffleDeck(cards: PartModel[]) {
  // シャッフル前の順番
  const originalOrders = cards.map((card) => card.order);
  // シャッフル
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // シャッフル後の順番に更新
  await Promise.all(
    cards.map(async (card, index) => {
      await PartModel.update(
        { order: originalOrders[index] },
        { where: { id: card.id } }
      );
    })
  );
}
