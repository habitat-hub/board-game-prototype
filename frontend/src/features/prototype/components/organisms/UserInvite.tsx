'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';
import { FaSearch, FaPlus, FaMinus } from 'react-icons/fa';
import { IoArrowBack } from 'react-icons/io5';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { useUsers } from '@/api/hooks/useUsers';
import { User } from '@/api/types';

import { UserCard } from '../molecules/UserCard';

/**
 * UserInviteコンポーネントのメインロジック
 */
const useUserInvite = (groupId: string) => {
  const { searchUsers } = useUsers();
  const {
    getAccessUsersByGroup,
    inviteUserToGroup,
    deleteUserFromGroup,
    getPrototypesByGroup,
  } = usePrototypes();

  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [prototypeName, setPrototypeName] = useState<string>('');

  // プロトタイプ名を取得
  const fetchPrototypeName = useCallback(async () => {
    try {
      const response = await getPrototypesByGroup(groupId);
      // 編集版プロトタイプを探す
      const editPrototype = response.find((p) => p.prototype.type === 'EDIT');
      if (editPrototype) {
        setPrototypeName(editPrototype.prototype.name);
      }
    } catch (error) {
      console.error('Error fetching prototype info:', error);
    }
  }, [getPrototypesByGroup, groupId]);

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

  // 初期化時に招待済みユーザーとプロトタイプ名を取得
  React.useEffect(() => {
    fetchInvitedUsers();
    fetchPrototypeName();
  }, [fetchInvitedUsers, fetchPrototypeName]);

  // ユーザー検索を実行
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      alert('検索するユーザー名を入力してください');
      return;
    }

    try {
      const users = await searchUsers({
        username: encodeURIComponent(searchTerm.trim()),
      });
      // 既に招待済みのユーザーを検索結果から除外
      const filteredUsers = users.filter(
        (user) => !invitedUsers.some((invited) => invited.id === user.id)
      );
      setSearchResults(filteredUsers);
      if (filteredUsers.length === 0) {
        // 検索結果のユーザーが全て参加済みかどうかに関わらず、
        // 単に「該当するユーザーが見つかりませんでした」と表示
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
        await deleteUserFromGroup(groupId, userId);
        setInvitedUsers((prev) => prev.filter((user) => user.id !== userId));
      } catch (error) {
        console.error('Error removing user:', error);
        alert('ユーザーの除外に失敗しました');
      }
    },
    [deleteUserFromGroup, groupId]
  );

  // ユーザーを招待（単一ユーザー用）
  const inviteUser = useCallback(
    async (user: User) => {
      try {
        await inviteUserToGroup(groupId, {
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
    [inviteUserToGroup, groupId, fetchInvitedUsers]
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
  };
};

const UserInvite: React.FC = () => {
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();
  const {
    invitedUsers,
    searchResults,
    searchTerm,
    setSearchTerm,
    handleSearch,
    removeInvitedUser,
    inviteUser,
    prototypeName,
  } = useUserInvite(groupId);

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow mt-16">
      <div className="flex items-center relative mb-6">
        <button
          onClick={() => router.push(`/prototypes/groups/${groupId}`)}
          className="p-2 hover:bg-content-secondary rounded-full transition-colors absolute left-0"
          title="プロトタイプ管理へ戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <h2 className="text-xl font-bold w-full text-center">ユーザー招待</h2>
      </div>

      {/* プロトタイプ名 */}
      {prototypeName && (
        <div className="mb-6">
          <p className="text-center text-wood-dark mt-2 mb-4">
            「{prototypeName}」を編集・プレイできるユーザーを追加します。
          </p>
        </div>
      )}

      {/* ユーザー検索フォーム */}
      <div className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 border rounded overflow-hidden flex items-center">
            <div className="p-2 text-gray-500">
              <FaSearch />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ユーザー名で検索"
              className="w-full p-2 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2 text-wood-dark bg-white hover:text-header rounded-lg hover:bg-wood-lightest transition-all duration-200 border border-wood-light shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <FaSearch className="h-4 w-4" />
            検索
          </button>
        </form>
      </div>

      {/* 検索結果 */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">検索結果</h3>
          <div className="shadow-md rounded-lg overflow-hidden bg-content border border-wood-lightest/20">
            {searchResults.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                actionButton={
                  <button
                    onClick={() => inviteUser(user)}
                    className="p-2 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors"
                    title="招待する"
                  >
                    <FaPlus className="h-4 w-4" />
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* 参加ユーザー */}
      <div>
        <h3 className="font-medium mb-2">参加ユーザー</h3>
        <div className="shadow-md rounded-lg overflow-hidden bg-content border border-wood-lightest/20">
          {invitedUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actionButton={
                <button
                  onClick={() => removeInvitedUser(user.id)}
                  className="p-2 text-wood hover:text-red-500 rounded-md hover:bg-wood-lightest/20 transition-colors"
                  title="プロトタイプから除外する"
                >
                  <FaMinus className="h-4 w-4" />
                </button>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInvite;
