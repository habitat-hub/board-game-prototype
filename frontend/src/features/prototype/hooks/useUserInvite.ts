import { useState, useCallback, useEffect } from 'react';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import { useUsers } from '@/api/hooks/useUsers';
import { User } from '@/api/types';

/**
 * ユーザー招待関連のロジックを管理するカスタムフック
 */
export const useUserInvite = (groupId: string) => {
  const { searchUsers } = useUsers();
  const {
    getAccessUsersByGroup,
    getPrototypeGroup,
    deleteInviteFromPrototypeGroup,
    inviteToPrototypeGroup,
  } = usePrototypeGroup();

  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [prototypeName, setPrototypeName] = useState<string>('');
  const [prototypeOwnerId, setPrototypeOwnerId] = useState<string>('');

  // 招待済みユーザーを取得
  const fetchInvitedUsers = useCallback(async () => {
    try {
      const response = await getAccessUsersByGroup(groupId);
      setInvitedUsers(response);
    } catch (error) {
      console.error('Error fetching invited users:', error);
      alert('ユーザーの取得に失敗しました。');
    }
  }, [getAccessUsersByGroup, groupId]);

  // プロトタイプ名とオーナーIDを取得
  const fetchPrototypeInfo = useCallback(async () => {
    try {
      const { prototypeGroup, prototypes } = await getPrototypeGroup(groupId);
      const mainPrototype = prototypes.find(({ type }) => type === 'MASTER');
      if (mainPrototype) {
        setPrototypeName(mainPrototype.name || '');
        setPrototypeOwnerId(prototypeGroup.userId || '');
      }
    } catch (error) {
      console.error('Error fetching prototype info:', error);
    }
  }, [getPrototypeGroup, groupId]);

  // 初期化時に招待済みユーザーとプロトタイプ情報を取得
  useEffect(() => {
    fetchInvitedUsers();
    fetchPrototypeInfo();
  }, [fetchInvitedUsers, fetchPrototypeInfo]);

  // ユーザー検索を実行
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      alert('検索するユーザー名を入力してください');
      return;
    }

    try {
      const users = await searchUsers({
        username: searchTerm.trim(),
      });
      // 既に招待済みのユーザーを検索結果から除外
      const filteredUsers = users.filter(
        (user) => !invitedUsers.some((invited) => invited.id === user.id)
      );
      setSearchResults(filteredUsers);
      if (filteredUsers.length === 0) {
        alert('該当するユーザーが見つかりませんでした');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      alert('ユーザーの検索に失敗しました');
    }
  }, [searchTerm, searchUsers, invitedUsers]);

  // 招待済みユーザーを削除
  const removeInvitedUser = useCallback(
    async (userId: string) => {
      try {
        await deleteInviteFromPrototypeGroup(groupId, userId);
        setInvitedUsers((prev) => prev.filter((user) => user.id !== userId));
      } catch (error) {
        console.error('Error removing user:', error);
        alert('ユーザーの除外に失敗しました');
      }
    },
    [deleteInviteFromPrototypeGroup, groupId]
  );

  // ユーザーを招待（単一ユーザー用）
  const inviteUser = useCallback(
    async (user: User) => {
      try {
        await inviteToPrototypeGroup(groupId, {
          guestIds: [user.id],
        });

        // 招待後、検索結果からそのユーザーを削除する
        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));

        // 招待済みユーザー一覧を更新する
        fetchInvitedUsers();
      } catch (error) {
        console.error('Error inviting user:', error);
        alert('ユーザーの招待に失敗しました');
      }
    },
    [inviteToPrototypeGroup, groupId, fetchInvitedUsers]
  );

  return {
    invitedUsers,
    searchResults,
    searchTerm,
    setSearchTerm,
    handleSearch,
    removeInvitedUser,
    inviteUser,
    prototypeName,
    prototypeOwnerId,
  };
};
