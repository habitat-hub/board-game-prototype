import type { User } from '@/api/types';

/** ロール名の列挙。UI と API の共通契約 */
export type RoleValue = 'admin' | 'editor' | 'viewer';

/** 権限削除可否の判定結果 */
export type RemoveCheck = { canRemove: boolean; reason: string };

/** プロジェクト内のユーザーとそのロール一覧 */
export interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: RoleValue; description: string }>;
}

/** トースト表示用の状態 */
export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  show: boolean;
}

/** 権限フォーム用の状態 */
export interface RoleFormState {
  selectedUserId: string | null;
  selectedRole: RoleValue;
}

/** 権限管理フックの公開インターフェース */
export interface UseRoleManagement {
  userRoles: UserRole[];
  candidateUsers: User[];
  masterPrototypeName: string;
  creator: User | null;
  loading: boolean;
  rolesReady: boolean;
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
