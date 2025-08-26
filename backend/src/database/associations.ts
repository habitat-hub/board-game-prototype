/**
 * モデル間のアソシエーション（関連）を定義するファイル
 *
 * このファイルでモデル間の関係を一箇所で管理し、
 * 循環依存を避けながら適切な関連を設定します。
 */

import RoleModel from '../models/Role';
import PermissionModel from '../models/Permission';
import RolePermissionModel from '../models/RolePermission';
import UserModel from '../models/User';
import UserRoleModel from '../models/UserRole';
import ProjectModel from '../models/Project';
import PrototypeModel from '../models/Prototype';

/**
 * すべてのモデル関連を設定
 */
export function setupAssociations() {
  // Role ↔ Permission (Many-to-Many through RolePermission)
  RoleModel.belongsToMany(PermissionModel, {
    through: RolePermissionModel,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
    as: 'permissions',
    onDelete: 'CASCADE',
  });

  PermissionModel.belongsToMany(RoleModel, {
    through: RolePermissionModel,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
    as: 'roles',
    onDelete: 'CASCADE',
  });

  // User ↔ Role (Many-to-Many through UserRole)
  UserModel.belongsToMany(RoleModel, {
    through: {
      model: UserRoleModel,
      unique: false,
    },
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'roles',
    onDelete: 'CASCADE',
  });

  RoleModel.belongsToMany(UserModel, {
    through: {
      model: UserRoleModel,
      unique: false,
    },
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'users',
    onDelete: 'CASCADE',
  });

  // UserRole の個別関連付け（リソース固有のロール管理のため）
  UserRoleModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'User',
    onDelete: 'CASCADE',
  });

  UserRoleModel.belongsTo(RoleModel, {
    foreignKey: 'roleId',
    as: 'Role',
    onDelete: 'CASCADE',
  });

  UserModel.hasMany(UserRoleModel, {
    foreignKey: 'userId',
    as: 'userRoles',
    onDelete: 'CASCADE',
  });

  RoleModel.hasMany(UserRoleModel, {
    foreignKey: 'roleId',
    as: 'roleAssignments',
    onDelete: 'CASCADE',
  });

  // Project と Prototype のスコープを定義
  setupProjectScopes();

  console.log('Model associations setup completed');
}

/**
 * Projectモデルのスコープを設定
 */
function setupProjectScopes() {
  // withPrototypes スコープ: プロジェクトと関連するプロトタイプを一緒に取得
  ProjectModel.addScope('withPrototypes', {
    include: [
      {
        model: PrototypeModel,
        as: 'prototypes', // hasMany で定義したエイリアス
        attributes: [
          'id',
          'name',
          'type',
          'sourceVersionPrototypeId',
          'createdAt',
          'updatedAt',
        ],
        required: false, // LEFT JOIN（プロトタイプがなくてもプロジェクトを取得）
      },
    ],
  });

  console.log('Project scopes setup completed');
}
