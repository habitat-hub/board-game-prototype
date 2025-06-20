/**
 * ロールタイプの定義
 * バックエンドの `backend/src/const.ts` の `ROLE_TYPE` と同期
 *
 * Role Hierarchy (権限の階層):
 * admin:  すべての権限 (read, write, delete, manage, play)
 * editor: 読み書き権限 (read, write)
 * player: 読み取りとプレイ権限 (read, play) - ゲーム中のパーツ操作が可能
 * viewer: 読み取り権限のみ (read) - 閲覧のみ
 */
export const ROLE_TYPE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  PLAYER: 'player',
  VIEWER: 'viewer',
} as const;

/**
 * 権限アクションの定義
 * バックエンドの `backend/src/const.ts` の `PERMISSION_ACTIONS` と同期
 */
export const PERMISSION_ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE: 'manage',
  PLAY: 'play',
} as const;

/**
 * リソースタイプの定義
 * バックエンドの `backend/src/const.ts` の `RESOURCE_TYPES` と同期
 */
export const RESOURCE_TYPES = {
  PROTOTYPE_GROUP: 'prototype_group',
  PROTOTYPE: 'prototype',
  USER: 'user',
} as const;

// 型定義
export type RoleType = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];
export type PermissionAction =
  (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS];
export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
