import { Op } from 'sequelize';
import AccessModel from '../models/Access';
import PartModel from '../models/Part';
import PrototypeModel from '../models/Prototype';
import PrototypeGroupModel from '../models/PrototypeGroup';
import UserModel from '../models/User';

/**
 * アクセス可能なプロトタイプを取得する
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロトタイプ
 */
export async function getAccessiblePrototypes({ userId }: { userId: string }) {
  const accesses = await AccessModel.findAll({
    include: {
      model: UserModel,
      where: { id: userId },
    },
  });
  const prototypeGroupIds = accesses.map((access) => access.prototypeGroupId);
  const prototypeGroups = await PrototypeGroupModel.findAll({
    where: { id: { [Op.in]: prototypeGroupIds } },
  });
  const prototypeIds = prototypeGroups.map((group) => group.prototypeId);
  return await PrototypeModel.findAll({
    where: { id: { [Op.in]: prototypeIds } },
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
  const selfPart = sortedParts.find((part) => part.id === partId);
  if (!selfPart) return;

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
  const selfPart = sortedParts.find((part) => part.id === partId);
  if (!selfPart) return;

  return sortedParts.find(
    (part) => part.order < selfPart.order && isOverlapping(selfPart, part)
  );
}

/**
 * デッキをシャッフルする
 * @param cards - シャッフルするパーツ
 */
export async function shuffleDeck(cards: PartModel[]) {
  const originalOrders = cards.map((card) => card.order);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  await Promise.all(
    cards.map(async (card, index) => {
      await PartModel.update(
        { order: originalOrders[index] },
        { where: { id: card.id } }
      );
    })
  );
}
