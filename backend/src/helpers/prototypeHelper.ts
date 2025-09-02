import { Op } from 'sequelize';
import PartModel from '../models/Part';
import ProjectModel from '../models/Project';
import { getAccessibleResourceIds } from './roleHelper';
import { RESOURCE_TYPES, PERMISSION_ACTIONS } from '../const';

/**
 * アクセス可能なプロジェクトを取得する（プロトタイプ付き）
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロジェクト（プロトタイプ付き）
 */
export async function getAccessibleProjects({ userId }: { userId: string }) {
  // ユーザーがアクセス可能なプロジェクトIDを取得
  const accessibleProjectIds = await getAccessibleResourceIds(
    userId,
    RESOURCE_TYPES.PROJECT,
    PERMISSION_ACTIONS.READ
  );

  // アクセス可能なプロジェクトをスコープ付きで取得
  return await ProjectModel.scope('withPrototypes').findAll({
    where: { id: { [Op.in]: accessibleProjectIds } },
  });
}

/**
 * アクセス可能なプロトタイプを取得する（効率化版）
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロトタイプ
 */
export async function getAccessiblePrototypes({ userId }: { userId: string }) {
  const projects = await getAccessibleProjects({ userId });

  // スコープを使って取得したデータを整形
  return projects.map((project) => {
    const projectData = project.toJSON() as {
      id: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
      prototypes?: unknown[];
    };

    return {
      project: {
        id: project.id,
        userId: project.userId,
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt,
      },
      prototypes: projectData.prototypes || [],
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
 * 配列をシャッフルする（純粋関数）
 * @param array - シャッフルする配列
 * @returns シャッフルされた新しい配列
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * デッキをシャッフルする（DB更新は含まない）
 * @param cards - シャッフルするパーツ
 * @returns シャッフル後のカードIDと順番の配列
 */
export function shuffleDeck(
  cards: PartModel[]
): { id: number; order: number }[] {
  const originalOrders = cards.map((card) => card.order);
  const shuffledCards = shuffleArray(cards);
  return shuffledCards.map((card, index) => ({
    id: card.id,
    order: originalOrders[index],
  }));
}

/**
 * シャッフルされたデッキの順番をDBに永続化する
 * @param cards - カードIDと順番の配列
 */
export async function persistDeckOrder(
  cards: { id: number; order: number }[]
): Promise<PartModel[]> {
  const updatedCards = await Promise.all(
    cards.map(async (card) => {
      const [, result] = await PartModel.update(
        { order: card.order },
        { where: { id: card.id }, returning: true }
      );
      return result[0].dataValues as PartModel;
    })
  );
  return updatedCards;
}
