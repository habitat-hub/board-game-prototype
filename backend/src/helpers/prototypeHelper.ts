import { Op } from 'sequelize';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import ImageModel from '../models/Image';
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
    order: [['createdAt', 'DESC']],
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

  // プロトタイプIDを抽出
  const prototypeIds = projects.flatMap((project) => {
    const projectData = project.toJSON() as {
      prototypes?: { id: string }[];
    };
    return projectData.prototypes?.map((proto) => proto.id) || [];
  });

  // 各プロトタイプに紐づくパーツ・パーツ設定・画像を取得
  const partsByPrototypeId: Record<string, PartModel[]> = {};
  if (prototypeIds.length > 0) {
    const parts = await PartModel.findAll({
      where: { prototypeId: { [Op.in]: prototypeIds } },
      include: [
        {
          model: PartPropertyModel,
          as: 'partProperties',
          include: [{ model: ImageModel, as: 'image' }],
        },
      ],
    });
    parts.forEach((part) => {
      const key = part.prototypeId;
      if (!partsByPrototypeId[key]) partsByPrototypeId[key] = [];
      partsByPrototypeId[key].push(part);
    });
  }

  // スコープを使って取得したデータを整形
  return projects.map((project) => {
    const projectData = project.toJSON() as {
      id: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
      prototypes?: { id: string; [key: string]: unknown }[];
    };

    return {
      project: {
        id: project.id,
        userId: project.userId,
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt,
      },
      prototypes: (projectData.prototypes || []).map((proto) => ({
        ...proto,
        parts: (partsByPrototypeId[proto.id] || []).map((part) =>
          part.toJSON()
        ),
      })),
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
  if (cards.length === 0) {
    return [];
  }

  const orderMap = new Map(cards.map((card) => [card.id, card.order]));
  const cardIds = Array.from(orderMap.keys());

  const existingRecords = await PartModel.findAll({
    where: { id: { [Op.in]: cardIds } },
  });

  if (existingRecords.length === 0) {
    return [];
  }

  const recordMap = new Map(
    existingRecords.map((record) => [record.id, record])
  );
  const timestamp = new Date();

  const payload: Array<Record<string, unknown>> = [];

  existingRecords.forEach((record) => {
    const nextOrder = orderMap.get(record.id);
    if (nextOrder === undefined) {
      return;
    }

    const plainRecord = record.get({ plain: true }) as Record<string, unknown>;

    payload.push({
      ...plainRecord,
      order: nextOrder,
      updatedAt: timestamp,
    });
  });

  if (payload.length === 0) {
    return [];
  }

  await PartModel.bulkCreate(
    payload as Parameters<typeof PartModel.bulkCreate>[0],
    {
      updateOnDuplicate: ['order', 'updatedAt'],
    }
  );

  return cards
    .map((card) => {
      const record = recordMap.get(card.id);
      if (!record) {
        return undefined;
      }
      const updatedOrder = orderMap.get(card.id);
      if (updatedOrder !== undefined) {
        record.set('order', updatedOrder);
        record.set('updatedAt', timestamp);
      }
      return record;
    })
    .filter((record): record is PartModel => record !== undefined);
}
