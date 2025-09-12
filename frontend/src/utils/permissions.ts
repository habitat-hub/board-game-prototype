import {
  PERMISSION_ACTIONS,
  RoleType,
  PermissionAction,
} from '@/constants/roles';

/** 役割ごとの許可アクション対応表 */
const ROLE_PERMISSIONS: Record<RoleType, PermissionAction[]> = {
  admin: [
    PERMISSION_ACTIONS.READ,
    PERMISSION_ACTIONS.WRITE,
    PERMISSION_ACTIONS.DELETE,
    PERMISSION_ACTIONS.MANAGE,
  ],
  editor: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE],
  viewer: [PERMISSION_ACTIONS.READ],
};

/**
 * 指定ロールがアクション可能かを判定する
 * @param role ロール（null/undefined は未設定）
 * @param action 判定対象アクション
 * @returns 許可されていれば true
 */
export const can = (
  role: RoleType | null | undefined,
  action: PermissionAction
): boolean => {
  // ロール未設定の場合は不可
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
};

/**
 * 指定ロールの許可アクション一覧を取得する
 * @param role ロール
 * @returns 許可アクション配列（未知ロールは空配列）
 */
export const getPermissions = (role: RoleType): PermissionAction[] =>
  ROLE_PERMISSIONS[role] ?? [];

export default ROLE_PERMISSIONS;
