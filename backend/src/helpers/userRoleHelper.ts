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

interface ProjectMember {
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
 * プロジェクトのメンバー一覧とロールを取得
 */
export async function getProjectMembers(
  projectId: string
): Promise<ProjectMember[]> {
  const userRoles = await UserRoleModel.findAll({
    where: {
      resourceType: RESOURCE_TYPES.PROJECT,
      resourceId: projectId,
    },
    include: [
      {
        model: RoleModel,
        as: 'Role',
        attributes: ['name', 'description'],
      },
    ],
  });

  // ユーザーごとにロールをまとめる
  const memberMap = new Map<string, ProjectMember>();

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
