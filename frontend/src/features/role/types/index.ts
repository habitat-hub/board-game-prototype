import type { User } from '@/api/types';

export type RoleValue = 'admin' | 'editor' | 'viewer';

export type RemoveCheck = { canRemove: boolean; reason: string };

export interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: RoleValue; description: string }>;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  show: boolean;
}

export interface RoleFormState {
  selectedUserId: string | null;
  selectedRole: RoleValue;
}

export interface UseRoleManagement {
  userRoles: UserRole[];
  candidateUsers: User[];
  masterPrototypeName: string;
  creator: User | null;
  loading: boolean;
  addRole: (userId: string, roleName: RoleValue) => Promise<void>;
  removeRole: (userId: string) => Promise<void>;
  updateRole: (userId: string, roleName: RoleValue) => Promise<void>;
  canRemoveUserRole: (
    targetUserId: string,
    list: Array<{ userId: string; roles: Array<{ name: RoleValue | string }> }>
  ) => RemoveCheck;
  isCurrentUserAdmin: boolean;
  refetch: () => Promise<void>;
  fetchAllUsers: (username?: string) => Promise<void>;
  roleForm: RoleFormState;
  toast: ToastState;
  handleAddRole: () => Promise<void>;
  handleRemoveRole: (userId: string) => Promise<void>;
  updateRoleForm: (updates: Partial<RoleFormState>) => void;
  closeToast: () => void;
}

