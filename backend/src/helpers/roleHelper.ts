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
  // リソース固有の権限をチェック
  const resourceSpecificRoles = await UserRoleModel.findAll({
    where: {
      userId,
      resourceId: resourceId || null,
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

  // リソース固有の権限がある場合
  if (resourceSpecificRoles.length > 0) {
    return true;
  }

  // グローバル権限をチェック（resourceId が null の場合）
  if (resourceId) {
    const globalRoles = await UserRoleModel.findAll({
      where: {
        userId,
        resourceId: null,
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

    return globalRoles.length > 0;
  }

  return false;
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
  // 既存のレコードを確認
  const existingRole = await UserRoleModel.findOne({
    where: {
      userId,
      roleId,
      resourceType,
      resourceId,
    },
  });

  // 既存のレコードがない場合のみ作成
  if (!existingRole) {
    await UserRoleModel.create({
      userId,
      roleId,
      resourceType,
      resourceId,
    });
  }
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
