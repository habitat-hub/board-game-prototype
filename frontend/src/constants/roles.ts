/**
 * ロールタイプの定義
 * バックエンドの `backend/src/const.ts` の `ROLE_TYPE` と同期
 *
 * Role Hierarchy (権限の階層):
 * admin:  すべての権限 (read, write, delete, manage)
 * editor: 読み書き権限 (read, write)
 * player: インスタンスルームでの操作権限 (read, interact)
 * viewer: 読み取り権限のみ (read) - 閲覧のみ
 */
export const ROLE_TYPE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  PLAYER: 'player',
  VIEWER: 'viewer',
} as const;

export type RoleType = (typeof ROLE_TYPE)[keyof typeof ROLE_TYPE];

export const ROLE_LABELS: Record<RoleType, string> = {
  admin: '管理者',
  editor: '編集者',
  player: 'プレイヤー',
  viewer: '閲覧者',
};

/**
 * ロールごとの優先順位。数値が小さいほど権限が高い。
 * creator と未知のロールの比較に使うため `UNKNOWN_ROLE_PRIORITY` を併用する。
 */
export const ROLE_PRIORITY = {
  [ROLE_TYPE.ADMIN]: 0,
  [ROLE_TYPE.EDITOR]: 1,
  [ROLE_TYPE.PLAYER]: 2,
  [ROLE_TYPE.VIEWER]: 3,
} as const satisfies Record<RoleType, number>;

/**
 * 未知のロール名が渡された場合のフォールバック優先度。
 * 既知ロールよりも低い権限として末尾に配置する。
 */
export const UNKNOWN_ROLE_PRIORITY =
  (Math.max(...Object.values(ROLE_PRIORITY)) || 0) + 1;

/**
 * 権限アクションの定義
 * バックエンドの `backend/src/const.ts` の `PERMISSION_ACTIONS` と同期
 */
export const PERMISSION_ACTIONS = {
  READ: 'read',
  INTERACT: 'interact',
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
