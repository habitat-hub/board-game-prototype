import UserRoleModel from '../models/UserRole';
import RoleModel from '../models/Role';
import PermissionModel from '../models/Permission';

/**
 * ユーザーが特定のリソースに対して権限を持っているかチェック
 */
export async function hasPermission(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string
): Promise<boolean> {
  // ユーザーのロールを取得
  const userRoles = await UserRoleModel.findAll({
    where: {
      userId,
      ...(resourceId && { resourceId }),
    },
    include: [
      {
        model: RoleModel,
        as: 'Role',
        include: [
          {
            model: PermissionModel,
            as: 'permissions',
            where: {
              resource,
              action,
            },
            required: true,
          },
        ],
        required: true,
      },
    ],
  });

  return userRoles.length > 0;
}

/**
 * ユーザーにロールを割り当て
 */
export async function assignRole(
  userId: string,
  roleId: number,
  resourceType: string,
  resourceId: string
): Promise<void> {
  await UserRoleModel.upsert({
    userId,
    roleId,
    resourceType,
    resourceId,
  });
}

/**
 * ユーザーからロールを削除
 */
export async function removeRole(
  userId: string,
  roleId: number,
  resourceType: string,
  resourceId: string
): Promise<void> {
  await UserRoleModel.destroy({
    where: {
      userId,
      roleId,
      resourceType,
      resourceId,
    },
  });
}

/**
 * ユーザーがアクセス可能なリソースIDを取得
 */
export async function getAccessibleResourceIds(
  userId: string,
  resourceType: string,
  action: string
): Promise<string[]> {
  const userRoles = await UserRoleModel.findAll({
    where: {
      userId,
      resourceType,
    },
    include: [
      {
        model: RoleModel,
        as: 'Role',
        include: [
          {
            model: PermissionModel,
            as: 'permissions',
            where: {
              resource: resourceType,
              action,
            },
            required: true,
          },
        ],
        required: true,
      },
    ],
  });

  return userRoles.map((userRole) => userRole.resourceId);
}
