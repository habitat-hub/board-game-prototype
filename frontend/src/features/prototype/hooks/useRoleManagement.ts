import { useState, useCallback, useEffect } from 'react';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import { useUsers } from '@/api/hooks/useUsers';
import { User, PrototypeGroupsDetailData } from '@/api/types';

interface UserRole {
  userId: string;
  user: User;
  roles: Array<{ name: string; description: string }>;
}

/**
 * ロール管理関連のロジックを管理するカスタムフック
 */
export const useRoleManagement = (groupId: string) => {
  const { searchUsers } = useUsers();
  const {
    getPrototypeGroupRoles,
    addRoleToPrototypeGroup,
    removeRoleFromPrototypeGroup,
    getPrototypeGroup,
  } = usePrototypeGroup();

  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupDetail, setGroupDetail] =
    useState<PrototypeGroupsDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  // ユーザーロール一覧を取得
  const fetchUserRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPrototypeGroupRoles(groupId);
      setUserRoles(response);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      alert('ロール一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [getPrototypeGroupRoles, groupId]);

  // グループ詳細を取得
  const fetchGroupDetail = useCallback(async () => {
    try {
      const response = await getPrototypeGroup(groupId);
      setGroupDetail(response);
    } catch (error) {
      console.error('Error fetching group detail:', error);
    }
  }, [getPrototypeGroup, groupId]);

  // 全ユーザーを取得（検索用）
  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await searchUsers({ username: '' });
      setAllUsers(response);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  }, [searchUsers]);

  // ロールを追加
  const addRole = useCallback(
    async (userId: string, roleName: 'admin' | 'editor') => {
      try {
        setLoading(true);
        await addRoleToPrototypeGroup(groupId, { userId, roleName });
        await fetchUserRoles(); // 一覧を再取得
        alert(`ユーザーに${roleName}ロールを追加しました。`);
      } catch (error) {
        console.error('Error adding role:', error);
        alert('ロールの追加に失敗しました。');
      } finally {
        setLoading(false);
      }
    },
    [addRoleToPrototypeGroup, groupId, fetchUserRoles]
  );

  // ロールを削除
  const removeRole = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);
        await removeRoleFromPrototypeGroup(groupId, userId);
        await fetchUserRoles(); // 一覧を再取得
        alert('ユーザーのロールを削除しました。');
      } catch (error) {
        console.error('Error removing role:', error);
        alert('ロールの削除に失敗しました。');
      } finally {
        setLoading(false);
      }
    },
    [removeRoleFromPrototypeGroup, groupId, fetchUserRoles]
  );

  // 初期化時にロール一覧、全ユーザー、グループ詳細を取得
  useEffect(() => {
    fetchUserRoles();
    fetchAllUsers();
    fetchGroupDetail();
  }, [fetchUserRoles, fetchAllUsers, fetchGroupDetail]);

  // ロールが割り当てられていないユーザーを取得
  const availableUsers = allUsers.filter(
    (user) => !userRoles.find((ur) => ur.userId === user.id)
  );

  // マスタープロトタイプ名を取得
  const masterPrototypeName =
    groupDetail?.prototypes?.find((prototype) => prototype.type === 'MASTER')
      ?.name || '';

  return {
    userRoles,
    availableUsers,
    masterPrototypeName,
    loading,
    addRole,
    removeRole,
    refetch: fetchUserRoles,
  };
};
