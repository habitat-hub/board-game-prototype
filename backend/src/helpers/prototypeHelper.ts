import { Op } from 'sequelize';
import PartModel from '../models/Part';
import ProjectModel from '../models/Project';
import PrototypeModel from '../models/Prototype';
import { getAccessibleResourceIds } from './roleHelper';
import { RESOURCE_TYPES, PERMISSION_ACTIONS } from '../const';

/**
 * アクセス可能なプロジェクトを取得する
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロジェクト
 */
export async function getAccessibleProjects({ userId }: { userId: string }) {
  // ユーザーがアクセス可能なプロジェクトIDを取得
  const accessibleProjectIds = await getAccessibleResourceIds(
    userId,
    RESOURCE_TYPES.PROJECT,
    PERMISSION_ACTIONS.READ
  );

  // アクセス可能なプロジェクト
  return await ProjectModel.findAll({
    where: { id: { [Op.in]: accessibleProjectIds } },
  });
}

/**
 * アクセス可能なプロトタイプを取得する
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロトタイプ
 */
export async function getAccessiblePrototypes({ userId }: { userId: string }) {
  const projects = await getAccessibleProjects({ userId });

  const prototypes = await PrototypeModel.findAll({
    where: {
      projectId: { [Op.in]: projects.map(({ id }) => id) },
    },
  });

  return projects.map((project) => {
    return {
      project,
      prototypes: prototypes.filter(
        ({ projectId }) => projectId === project.id
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
