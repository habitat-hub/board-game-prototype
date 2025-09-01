/**
 * ロールタイプの定義
 *
 * Role Hierarchy (権限の階層):
 * admin:  すべての権限 (read, write, delete, manage)
 * editor: 読み書き権限 (read, write)
 * viewer: 読み取り権限のみ (read) - 閲覧のみ
 */
export const ROLE_TYPE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

/**
 * 権限アクションの定義
 *
 * READ:   リソースの閲覧
 * WRITE:  リソースの編集・作成
 * DELETE: リソースの削除
 * MANAGE: リソースの管理（メンバー招待、設定変更など）
 */
export const PERMISSION_ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];

export const RESOURCE_TYPES = {
  PROJECT: 'project',
  PROTOTYPE: 'prototype',
  USER: 'user',
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];

export const UPDATABLE_PROTOTYPE_FIELDS = {
  PROTOTYPE: ['name'],
  PART: [
    'name',
    'description',
    'color',
    'textColor',
    'position',
    'width',
    'height',
    'frontSide',
    'ownerId',
  ],
};
