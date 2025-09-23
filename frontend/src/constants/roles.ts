/**
 * ロールタイプの定義
 * バックエンドの `backend/src/const.ts` の `ROLE_TYPE` と同期
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
} as const;

export type RoleType = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];

export const ROLE_LABELS: Record<RoleType, string> = {
  admin: '管理者',
  editor: '編集者',
  viewer: '閲覧者',
};

/**
 * 権限アクションの定義
 * バックエンドの `backend/src/const.ts` の `PERMISSION_ACTIONS` と同期
 */
export const PERMISSION_ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

/**
 * リソースタイプの定義
 * バックエンドの `backend/src/const.ts` の `RESOURCE_TYPES` と同期
 */
export const RESOURCE_TYPES = {
  PROJECT: 'project',
  PROTOTYPE: 'prototype',
  USER: 'user',
} as const;

export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];
export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
