import UserRoleModel from '../models/UserRole';
import RoleModel from '../models/Role';
import PermissionModel from '../models/Permission';
import { Transaction } from 'sequelize';

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
  resourceId: string,
  transaction?: Transaction
): Promise<void> {
  // 既存のレコードを確認（完全一致）
  const existingRole = await UserRoleModel.findOne({
    where: {
      userId,
      roleId,
      resourceType,
      resourceId,
    },
    transaction,
  });

  if (existingRole) {
    return;
  }

  // 部分的な重複チェック（同じリソースタイプでの重複を防ぐ）
  const partialMatch = await UserRoleModel.findOne({
    where: {
      userId,
      roleId,
      resourceType,
    },
    transaction,
  });

  if (partialMatch) {
    // 同じリソースタイプで既にロールが割り当てられている場合
    // 異なるリソースIDなら許可、同じリソースIDなら重複なので拒否
    if (partialMatch.resourceId === resourceId) {
      return;
    }
  }

  // 既存のレコードがない場合のみ作成
  try {
    await UserRoleModel.create(
      {
        userId,
        roleId,
        resourceType,
        resourceId,
      },
      { transaction }
    );
  } catch (error) {
    console.error('Failed to create UserRole:', {
      error: error instanceof Error ? error.message : String(error),
      data: { userId, roleId, resourceType, resourceId },
    });

    // Sequelize ValidationErrorの詳細を出力
    if (error && typeof error === 'object' && 'name' in error) {
      const sequelizeError = error as {
        name: string;
        errors?: Array<{
          path: string;
          value: unknown;
          message: string;
          type: string;
          validatorKey: string;
          validatorArgs: unknown;
        }>;
        fields?: Record<string, unknown>;
        table?: string;
        parent?: { detail?: string; message?: string };
      };
      if (
        sequelizeError.name === 'SequelizeValidationError' &&
        sequelizeError.errors
      ) {
        console.error(
          'Validation errors:',
          sequelizeError.errors.map((err) => ({
            field: err.path,
            value: err.value,
            message: err.message,
            type: err.type,
            validatorKey: err.validatorKey,
            validatorArgs: err.validatorArgs,
          }))
        );
      }
      if (sequelizeError.name === 'SequelizeUniqueConstraintError') {
        console.error('Unique constraint error:', {
          fields: sequelizeError.fields,
          table: sequelizeError.table,
          parent:
            sequelizeError.parent?.detail || sequelizeError.parent?.message,
        });
      }
    }

    throw error;
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
