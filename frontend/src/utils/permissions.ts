import {
  PERMISSION_ACTIONS,
  RoleType,
  PermissionAction,
} from '@/constants/roles';

/**
 * Maps each role to its allowed permission actions.
 */
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
 * Check if the given role can perform the specified action.
 */
export const can = (
  role: RoleType | null | undefined,
  action: PermissionAction
): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
};

export const getPermissions = (role: RoleType): PermissionAction[] =>
  ROLE_PERMISSIONS[role] ?? [];

export default ROLE_PERMISSIONS;
