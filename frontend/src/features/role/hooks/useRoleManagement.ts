import { useState, useCallback, useEffect } from 'react';

import { useProject } from '@/api/hooks/useProject';
import { useUsers } from '@/api/hooks/useUsers';
import { User, ProjectsDetailData } from '@/api/types';
import { useUser } from '@/hooks/useUser';

interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: string; description: string }>;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  show: boolean;
}

interface ConfirmDialogState {
  userId: string;
  userName: string;
}

interface RoleFormState {
  selectedUserId: string | null;
  selectedRole: 'admin' | 'editor' | 'viewer';
}

/**
 * 権限管理関連のロジックを管理するカスタムフック
 */
export const useRoleManagement = (projectId: string) => {
  const { user: currentUser } = useUser();
  const { searchUsers } = useUsers();
  const {
    getProjectRoles,
    addRoleToProject,
    removeRoleFromProject,
    updateRoleInProject,
    getProject,
  } = useProject();

  // データ状態
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([]);
  const [projectDetail, setProjectDetail] = useState<ProjectsDetailData | null>(
    null
  );
  const [creator, setCreator] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // UI状態
  const [roleForm, setRoleForm] = useState<RoleFormState>({
    selectedUserId: null,
    selectedRole: 'admin',
  });
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    show: false,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    data: ConfirmDialogState | null;
  }>({
    show: false,
    data: null,
  });

  // トーストメッセージを表示する関数
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning') => {
      setToast({ message, type, show: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
    },
    []
  );

  // トーストを閉じる関数
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // ユーザーロール一覧を取得
  const fetchUserRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProjectRoles(projectId);
      setUserRoles(response);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      showToast('権限一覧の取得に失敗しました。', 'error');
    } finally {
      setLoading(false);
    }
  }, [getProjectRoles, projectId, showToast]);

  // プロジェクト詳細を取得
  const fetchProjectDetail = useCallback(async () => {
    try {
      const project = await getProject(projectId);
      setProjectDetail(project);

      // 作成者の情報を取得
      if (project.userId) {
        try {
          const usersResponse = await searchUsers({ username: '' });
          const creatorUser = usersResponse.find(
            (user) => user.id === project.userId
          );
          if (creatorUser) {
            setCreator(creatorUser);
          }
        } catch (error) {
          console.error('Error fetching creator info:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching project detail:', error);
    }
  }, [getProject, projectId, searchUsers]);

  // 全ユーザーを取得（検索用）
  // username を渡すとそのクエリで検索する。渡さない場合は全件取得（""）
  const fetchUsers = useCallback(
    async (username: string = '') => {
      try {
        const response = await searchUsers({ username });
        setFetchedUsers(response);
      } catch (error) {
        console.error('Error fetching all users:', error);
      }
    },
    [searchUsers]
  );

  // ロールを追加
  const addRole = useCallback(
    async (userId: string, roleName: 'admin' | 'editor' | 'viewer') => {
      try {
        setLoading(true);
        await addRoleToProject(projectId, { userId, roleName });
        await fetchUserRoles(); // 一覧を再取得
        await fetchUsers(); // ユーザー検索用リストを再取得
        showToast(`ユーザーに${roleName}権限を追加しました。`, 'success');
      } catch (error) {
        console.error('Error adding role:', error);
        showToast('権限の追加に失敗しました。', 'error');
      } finally {
        setLoading(false);
      }
    },
    [addRoleToProject, projectId, fetchUserRoles, fetchUsers, showToast]
  );

  // ロール更新
  const updateRole = useCallback(
    async (userId: string, roleName: 'admin' | 'editor' | 'viewer') => {
      try {
        setLoading(true);
        await updateRoleInProject(projectId, userId, { roleName });
        await fetchUserRoles(); // 一覧を再取得
        showToast(`ユーザーの権限を${roleName}に変更しました。`, 'success');
      } catch (error) {
        console.error('Error updating role:', error);
        showToast('権限の変更に失敗しました。', 'error');
      } finally {
        setLoading(false);
      }
    },
    [updateRoleInProject, projectId, fetchUserRoles, showToast]
  );

  // ユーザーのロール削除が可能かチェック
  const canRemoveUserRole = useCallback(
    (targetUserId: string, userRoles: UserRole[]) => {
      // 現在のユーザー情報がない場合は削除不可
      if (!currentUser || !projectDetail) {
        return { canRemove: false, reason: 'ユーザー情報が取得できません' };
      }

      // プロジェクトの作成者の場合は削除不可
      if (projectDetail.userId === targetUserId) {
        return {
          canRemove: false,
          reason: 'プロジェクトの作成者の権限は削除できません',
        };
      }

      // 対象ユーザーのロールを取得
      const targetUserRole = userRoles.find((ur) => ur.userId === targetUserId);
      if (!targetUserRole) {
        return { canRemove: false, reason: 'ユーザーが見つかりません' };
      }

      // 管理者ロールを持っているかチェック
      const hasAdminRole = targetUserRole.roles.some(
        (role) => role.name === 'admin'
      );

      if (hasAdminRole) {
        // 管理者の総数をカウント
        const adminCount = userRoles.filter((ur) =>
          ur.roles.some((role) => role.name === 'admin')
        ).length;

        // 最後の管理者の場合は削除不可
        if (adminCount <= 1) {
          return {
            canRemove: false,
            reason: '最後の管理者の権限は削除できません',
          };
        }
      }

      return { canRemove: true, reason: '' };
    },
    [currentUser, projectDetail]
  );

  // ロール削除（エラーハンドリング改善）
  const removeRole = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);
        await removeRoleFromProject(projectId, userId);
        await fetchUserRoles(); // 一覧を再取得
        await fetchUsers(); // ユーザー検索用リストを再取得
        showToast('ユーザーの権限を削除しました。', 'success');
      } catch (error: unknown) {
        console.error('Error removing role:', error);
        const errorMessage = '権限の削除に失敗しました。';
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [removeRoleFromProject, projectId, fetchUserRoles, fetchUsers, showToast]
  );

  // ハンドラー関数群
  const handleAddRole = useCallback(async () => {
    if (roleForm.selectedUserId && roleForm.selectedRole) {
      await addRole(roleForm.selectedUserId, roleForm.selectedRole);
      setRoleForm({
        selectedUserId: null,
        selectedRole: 'admin',
      });
    }
  }, [roleForm.selectedUserId, roleForm.selectedRole, addRole]);

  const handleUpdateRole = useCallback(
    async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
      await updateRole(userId, newRole);
    },
    [updateRole]
  );

  const handleRemoveRole = useCallback(
    (userId: string) => {
      const removeCheck = canRemoveUserRole(userId, userRoles);

      if (!removeCheck.canRemove) {
        showToast(removeCheck.reason, 'warning');
        return;
      }

      // 確認ダイアログを表示
      const user = userRoles.find((ur) => ur.userId === userId);
      if (user) {
        setConfirmDialog({
          show: true,
          data: { userId, userName: user.user.username },
        });
      }
    },
    [userRoles, canRemoveUserRole, showToast]
  );

  const handleConfirmRemove = useCallback(async () => {
    if (confirmDialog.data) {
      await removeRole(confirmDialog.data.userId);
      setConfirmDialog({ show: false, data: null });
    }
  }, [confirmDialog.data, removeRole]);

  const handleCancelRemove = useCallback(() => {
    setConfirmDialog({ show: false, data: null });
  }, []);

  const updateRoleForm = useCallback((updates: Partial<RoleFormState>) => {
    setRoleForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // 初期化時に権限一覧、全ユーザー、プロジェクト詳細を取得
  useEffect(() => {
    fetchUserRoles();
    fetchUsers();
    fetchProjectDetail();
  }, [fetchUserRoles, fetchUsers, fetchProjectDetail]);

  // 権限が割り当てられていないユーザーを取得
  const candidateUsers = fetchedUsers.filter(
    (user) => !userRoles.find((ur) => ur.userId === user.id)
  );

  // マスタープロトタイプ名を取得
  const masterPrototypeName =
    projectDetail?.prototypes?.find((prototype) => prototype.type === 'MASTER')
      ?.name || '';

  return {
    // データ
    userRoles,
    candidateUsers,
    masterPrototypeName,
    creator,
    loading,

    // 基本操作
    addRole,
    removeRole,
    updateRole,
    canRemoveUserRole,
    refetch: fetchUserRoles,
    // ユーザー検索を呼び出すために username を受け取れる fetchAllUsers を公開
    fetchAllUsers: fetchUsers,

    // UI状態
    roleForm,
    toast,
    confirmDialog,

    // ハンドラー
    handleAddRole,
    handleUpdateRole,
    handleRemoveRole,
    handleConfirmRemove,
    handleCancelRemove,
    updateRoleForm,
    closeToast,
  };
};
