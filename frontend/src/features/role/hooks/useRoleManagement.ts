import { useState, useCallback, useEffect, useMemo } from 'react';

import { useProject } from '@/api/hooks/useProject';
import { useUsers } from '@/api/hooks/useUsers';
import { User, ProjectsDetailData } from '@/api/types';
import { PERMISSION_ACTIONS, RoleType } from '@/constants/roles';
import type {
  RoleValue,
  RoleFormState,
  ToastState,
  UserRole,
  RemoveCheck,
  UseRoleManagement,
} from '@/features/role/types';
import { useUser } from '@/hooks/useUser';
import { can } from '@/utils/permissions';

/**
 * 権限管理のビジネスロジックを提供するカスタムフック。
 * プロジェクトのロール一覧取得・更新、作成者情報取得、UI用状態と
 * ハンドラーをひとまとめにして提供します。
 *
 * @param projectId プロジェクトID
 * @returns 権限一覧・候補ユーザー・作成者情報・マスタープロトタイプ名・ローディング状態、
 * ならびに addRole/removeRole/updateRole/canRemoveUserRole/isCurrentUserAdmin/
 * refetch/fetchAllUsers、UI状態（roleForm/toast）とハンドラー（handleAddRole/
 * handleRemoveRole/updateRoleForm/closeToast）を返します。
 */
export const useRoleManagement = (projectId: string): UseRoleManagement => {
  const TOAST_DURATION_MS = 3000; // トーストの表示時間(ms)
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
  const [loading, setLoading] = useState<boolean>(false);
  const [rolesReady, setRolesReady] = useState<boolean>(false);
  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUser) return false;
    const currentUserRole = userRoles.find(
      (ur) => ur.userId === currentUser.id
    );
    return currentUserRole
      ? currentUserRole.roles.some((role) =>
          can(role.name as RoleType, PERMISSION_ACTIONS.MANAGE)
        )
      : false;
  }, [currentUser, userRoles]);

  // UI状態
  const [roleForm, setRoleForm] = useState<RoleFormState>({
    selectedUserId: null,
    selectedRole: 'editor',
  });
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    show: false,
  });

  // トーストメッセージを表示する関数
  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, TOAST_DURATION_MS);
  }, []);

  // トーストを閉じる関数
  const closeToast = useCallback((): void => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // ユーザーロール一覧を取得
  const fetchUserRoles: () => Promise<void> = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProjectRoles(projectId);
      // Normalize API payload (string role names) into RoleValue
      const toRoleValue = (name: string): RoleValue => {
        if (name === 'admin' || name === 'editor' || name === 'viewer') {
          return name as RoleValue;
        }
        // 想定外のロール名の場合はフォールバックしつつ警告を出す
        console.warn(
          `[useRoleManagement] 未知のロール名を検出: ${name}。viewer にフォールバックします。`
        );
        return 'viewer';
      };
      const normalized = response.map((ur) => ({
        ...ur,
        roles: ur.roles.map((r) => ({ ...r, name: toRoleValue(r.name) })),
      }));
      setUserRoles(normalized);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      showToast('権限一覧の取得に失敗しました。', 'error');
    } finally {
      setLoading(false);
      setRolesReady(true);
    }
  }, [getProjectRoles, projectId, showToast]);

  // プロジェクト詳細を取得
  const fetchProjectDetail: () => Promise<void> = useCallback(async () => {
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
  const fetchUsers: (username?: string) => Promise<void> = useCallback(
    async (username: string = ''): Promise<void> => {
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
  const addRole: (userId: string, roleName: RoleValue) => Promise<void> =
    useCallback(
      async (userId: string, roleName: RoleValue): Promise<void> => {
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
  const updateRole: (userId: string, roleName: RoleValue) => Promise<void> =
    useCallback(
      async (userId: string, roleName: RoleValue): Promise<void> => {
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
  const canRemoveUserRole: (
    targetUserId: string,
    rolesList: Array<{
      userId: string;
      roles: Array<{ name: RoleValue | string }>;
    }>
  ) => RemoveCheck = useCallback(
    (
      targetUserId: string,
      rolesList: Array<{
        userId: string;
        roles: Array<{ name: RoleValue | string }>;
      }>
    ): RemoveCheck => {
      if (!currentUser || !projectDetail) {
        return { canRemove: false, reason: 'ユーザー情報が取得できません' };
      }

      // 自分自身の場合: 権限は削除不可（最優先チェック）
      if (currentUser.id === targetUserId) {
        return { canRemove: false, reason: '自分の権限は削除できません' };
      }

      // 権限設定可能なユーザーかどうか（Admin のみ）
      if (!isCurrentUserAdmin) {
        return {
          canRemove: false,
          reason: '権限を設定できるのはAdminユーザーのみです',
        };
      }

      // プロジェクト作成者の場合は削除不可
      if (projectDetail.userId === targetUserId) {
        return {
          canRemove: false,
          reason: 'プロジェクトの作成者の権限は削除できません',
        };
      }

      const targetUserRole = rolesList.find((ur) => ur.userId === targetUserId);
      if (!targetUserRole) {
        return { canRemove: false, reason: 'ユーザーが見つかりません' };
      }

      // 対象ユーザーが管理権限を持つか
      const hasAdminRole = targetUserRole.roles.some((role) =>
        can(role.name as RoleType, PERMISSION_ACTIONS.MANAGE)
      );

      if (hasAdminRole) {
        // 残存する管理権限ユーザー数を確認
        const adminCount = rolesList.filter((ur) =>
          ur.roles.some((role) =>
            can(role.name as RoleType, PERMISSION_ACTIONS.MANAGE)
          )
        ).length;

        if (adminCount <= 1) {
          return {
            canRemove: false,
            reason: '最後のAdminの権限は削除できません',
          };
        }
      }

      return { canRemove: true, reason: '' };
    },
    [currentUser, projectDetail, isCurrentUserAdmin]
  );

  // ロール削除（エラーハンドリング改善）
  const removeRole: (userId: string) => Promise<void> = useCallback(
    async (userId: string): Promise<void> => {
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
  const handleAddRole: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      if (roleForm.selectedUserId && roleForm.selectedRole) {
        await addRole(roleForm.selectedUserId, roleForm.selectedRole);
        setRoleForm({
          selectedUserId: null,
          selectedRole: 'editor',
        });
      }
    }, [roleForm.selectedUserId, roleForm.selectedRole, addRole]);

  const handleRemoveRole: (userId: string) => Promise<void> = useCallback(
    async (userId: string): Promise<void> => {
      const removeCheck = canRemoveUserRole(userId, userRoles);

      if (!removeCheck.canRemove) {
        showToast(removeCheck.reason, 'warning');
        return;
      }

      await removeRole(userId);
    },
    [userRoles, canRemoveUserRole, showToast, removeRole]
  );

  const updateRoleForm = useCallback(
    (updates: Partial<RoleFormState>): void => {
      setRoleForm((prev) => ({ ...prev, ...updates }));
    },
    []
  );

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
    rolesReady,

    // 基本操作
    addRole,
    removeRole,
    updateRole,
    canRemoveUserRole,
    isCurrentUserAdmin,
    refetch: fetchUserRoles,
    // ユーザー検索を呼び出すために username を受け取れる fetchAllUsers を公開
    fetchAllUsers: fetchUsers,

    // UI状態
    roleForm,
    toast,

    // ハンドラー
    handleAddRole,
    handleRemoveRole,
    updateRoleForm,
    closeToast,
  };
};
