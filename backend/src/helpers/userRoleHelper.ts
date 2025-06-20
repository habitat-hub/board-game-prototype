import UserRoleModel from '../models/UserRole';
import RoleModel from '../models/Role';
import { RESOURCE_TYPES } from '../const';

// 型定義
interface UserRoleWithRole extends UserRoleModel {
  Role: RoleModel;
}

interface RoleInfo {
  name: string;
  description: string;
}

interface PrototypeGroupMember {
  userId: string;
  roles: RoleInfo[];
}

/**
 * ユーザーの特定リソースに対するロールを取得
 */
export async function getUserRoles(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<string[]> {
  const userRoles = await UserRoleModel.findAll({
    where: {
      userId,
      resourceType,
      resourceId,
    },
    include: [
      {
        model: RoleModel,
        as: 'Role',
        attributes: ['name'],
      },
    ],
  });

  return userRoles.map((userRole) => (userRole as UserRoleWithRole).Role.name);
}

/**
 * プロトタイプグループのメンバー一覧とロールを取得
 */
export async function getPrototypeGroupMembers(
  prototypeGroupId: string
): Promise<PrototypeGroupMember[]> {
  const userRoles = await UserRoleModel.findAll({
    where: {
      resourceType: RESOURCE_TYPES.PROTOTYPE_GROUP,
      resourceId: prototypeGroupId,
    },
    include: [
      {
        model: RoleModel,
        as: 'Role',
        attributes: ['name', 'description'],
      },
    ],
  });

  // ユーザーごとにロールをグループ化
  const memberMap = new Map<string, PrototypeGroupMember>();

  userRoles.forEach((userRole) => {
    const userRoleWithRole = userRole as UserRoleWithRole;
    const userId = userRoleWithRole.userId;
    if (!memberMap.has(userId)) {
      memberMap.set(userId, {
        userId,
        roles: [],
      });
    }
    memberMap.get(userId)!.roles.push({
      name: userRoleWithRole.Role.name,
      description: userRoleWithRole.Role.description,
    });
  });

  return Array.from(memberMap.values());
}
