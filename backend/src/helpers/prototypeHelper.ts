import { Op } from 'sequelize';
import PartModel from '../models/Part';
import PartPropertyModel from '../models/PartProperty';
import ImageModel from '../models/Image';
import ProjectModel from '../models/Project';
import UserModel from '../models/User';
import UserRoleModel from '../models/UserRole';
import RoleModel from '../models/Role';
import { getAccessibleResourceIds } from './roleHelper';
import { RESOURCE_TYPES, PERMISSION_ACTIONS, ROLE_TYPE } from '../const';

type PermissionFlags = {
  canRead: boolean;
  canInteract: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManage: boolean;
};

const DEFAULT_PERMISSIONS = (): PermissionFlags => ({
  canRead: true,
  canInteract: false,
  canWrite: false,
  canDelete: false,
  canManage: false,
});

const ROLE_PERMISSION_MAP: Record<string, PermissionFlags> = {
  [ROLE_TYPE.ADMIN]: {
    canRead: true,
    canInteract: true,
    canWrite: true,
    canDelete: true,
    canManage: true,
  },
  [ROLE_TYPE.EDITOR]: {
    canRead: true,
    canInteract: true,
    canWrite: true,
    canDelete: false,
    canManage: false,
  },
  [ROLE_TYPE.PLAYER]: {
    canRead: true,
    canInteract: true,
    canWrite: false,
    canDelete: false,
    canManage: false,
  },
  [ROLE_TYPE.VIEWER]: {
    canRead: true,
    canInteract: false,
    canWrite: false,
    canDelete: false,
    canManage: false,
  },
};

function mergePermissionFlags(
  base: PermissionFlags,
  addition: PermissionFlags
): PermissionFlags {
  return {
    canRead: base.canRead || addition.canRead,
    canInteract: base.canInteract || addition.canInteract,
    canWrite: base.canWrite || addition.canWrite,
    canDelete: base.canDelete || addition.canDelete,
    canManage: base.canManage || addition.canManage,
  };
}

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
    include: [
      {
        model: UserModel,
        attributes: ['id', 'username'],
      },
    ],
  });
}

/** アクセス可能プロジェクトの一覧（owner/permissions付き）を取得 */
type ProjectOwner = { id: string; username: string };
type PrototypePlain = { id: string } & Record<string, unknown>;
type ProjectSummary = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  owner: ProjectOwner | null;
  permissions: PermissionFlags;
};
type ProjectListEntry = {
  project: ProjectSummary;
  prototypes: Array<PrototypePlain & { parts: Array<Record<string, unknown>> }>;
};

/**
 * アクセス可能なプロトタイプを取得する（効率化版）
 *
 * @param userId - ユーザーID
 * @returns アクセス可能なプロトタイプ
 */
export async function getAccessiblePrototypes({
  userId,
}: {
  userId: string;
}): Promise<ProjectListEntry[]> {
  const projects = await getAccessibleProjects({ userId });

  const projectRecords = projects.map((project) => ({
    project,
    plain: project.get({
      plain: true,
    }) as {
      id: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
      prototypes?: { id: string; [key: string]: unknown }[];
      User?: { id: string; username: string } | null;
    },
  }));

  const accessibleProjectIds = projectRecords.map(({ project }) => project.id);

  const permissionByProjectId: Record<string, PermissionFlags> = {};

  // プロジェクトIDがある場合
  if (accessibleProjectIds.length > 0) {
    const userRoles = await UserRoleModel.findAll({
      where: {
        userId,
        resourceType: RESOURCE_TYPES.PROJECT,
        resourceId: { [Op.in]: accessibleProjectIds },
      },
      include: [
        {
          model: RoleModel,
          as: 'Role',
          attributes: ['name'],
        },
      ],
    });

    userRoles.forEach((userRole) => {
      const projectId = userRole.resourceId;
      const roleName = userRole.Role?.name;
      // 関連データが無い場合はスキップ
      if (!projectId || !roleName) {
        return;
      }

      const currentPermissions =
        permissionByProjectId[projectId] ?? DEFAULT_PERMISSIONS();
      const nextPermissions =
        ROLE_PERMISSION_MAP[roleName] ?? DEFAULT_PERMISSIONS();
      permissionByProjectId[projectId] = mergePermissionFlags(
        currentPermissions,
        nextPermissions
      );
    });
  }

  // ロールが見つからないが「作成者＝オーナー」の場合はADMIN相当を付与
  for (const { project, plain } of projectRecords) {
    if (!permissionByProjectId[project.id] && plain.userId === userId) {
      permissionByProjectId[project.id] = mergePermissionFlags(
        DEFAULT_PERMISSIONS(),
        ROLE_PERMISSION_MAP[ROLE_TYPE.ADMIN]
      );
    }
  }

  // プロトタイプIDを抽出
  const prototypeIds = projectRecords.flatMap(
    ({ plain }) => plain.prototypes?.map((proto) => proto.id) || []
  );

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
  return projectRecords.map(({ project, plain }) => {
    const owner = plain.User
      ? {
          id: plain.User.id,
          username: plain.User.username,
        }
      : null;

    const permissions =
      permissionByProjectId[project.id] ?? DEFAULT_PERMISSIONS();

    const prototypes = (plain.prototypes ?? []) as PrototypePlain[];

    return {
      project: {
        id: project.id,
        userId: project.userId,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        owner,
        permissions,
      },
      prototypes: prototypes.map((proto) => ({
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
