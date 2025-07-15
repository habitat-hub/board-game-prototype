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
  const updatedCards = await Promise.all(
    cards.map(async (card, index) => {
      const [, result] = await PartModel.update(
        { order: originalOrders[index] },
        { where: { id: card.id }, returning: true }
      );
      return result[0].dataValues;
    })
  );
  return updatedCards;
}
