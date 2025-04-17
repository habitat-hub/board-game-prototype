'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { CiSquareRemove } from 'react-icons/ci';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { useUsers } from '@/api/hooks/useUsers';
import { User } from '@/api/types';

const PlayerInvite: React.FC = () => {
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();

  const { searchUsers } = useUsers();
  const { getAccessUsersByGroup, inviteUserToGroup, deleteUserFromGroup } =
    usePrototypes();
  // TODO: もう少しステート整理したい
  // 招待されているユーザー
  const [invitedUsers, setInvitedUsers] = useState<User[]>([]);
  // 検索用語
  const [searchTerm, setSearchTerm] = useState('');
  // 検索結果
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  // 選択中のユーザー
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // エラー
  const [error, setError] = useState<string | null>(null);
  // 成功メッセージ
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * メッセージを表示し、5秒後に自動的に削除
   * @param message - 表示するメッセージ
   * @param type - メッセージの種類 ('success' または 'error')
   */
  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage(message);
    } else if (type === 'error') {
      setError(message);
    }

    const timer = setTimeout(() => {
      if (type === 'success') {
        setSuccessMessage(null);
      } else if (type === 'error') {
        setError(null);
      }
    }, 3000);

    // クリーンアップ処理
    return () => clearTimeout(timer);
  };

  /**
   * 招待されているユーザーを取得
   */
  const fetchInvitedUsers = useCallback(async () => {
    const response = await getAccessUsersByGroup(groupId);
    setInvitedUsers(response);
  }, [getAccessUsersByGroup, groupId]);

  // グループにアクセス可能なユーザーを取得
  useEffect(() => {
    fetchInvitedUsers();
  }, [fetchInvitedUsers]);

  // ユーザーを検索
  useEffect(() => {
    if (searchTerm === '') {
      setSuggestedUsers([]);
      return;
    }

    searchUsers({ username: encodeURIComponent(searchTerm) })
      .then((response) => {
        setSuggestedUsers(response);
        setError(null);
      })
      .catch(() => {
        showMessage(
          'ユーザーの検索に失敗しました。再度お試しください。',
          'error'
        );
      });
  }, [searchTerm, searchUsers]);

  /**
   * ユーザーを選択
   * @param user - ユーザー
   */
  const handleSelectUser = (user: User) => {
    // すでに選択されている場合
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSearchTerm('');
      setSuggestedUsers([]);
      return;
    }

    setSelectedUsers((prev) => [...prev, user]);
    setSearchTerm('');
    setSuggestedUsers([]);
  };

  /**
   * ユーザーを招待
   * @param e - イベント
   */
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    // 選択されているユーザーがいない場合
    if (selectedUsers.length === 0) {
      showMessage('ユーザーを選択してください。', 'error');
      return;
    }

    try {
      await inviteUserToGroup(groupId, {
        guestIds: selectedUsers.map((user) => user.id),
      });

      setSelectedUsers([]);
      setSearchTerm('');
      setError(null);
      showMessage('招待が成功しました！', 'success');
      fetchInvitedUsers();
    } catch (error) {
      console.error('Error inviting users:', error);
      showMessage('プロトタイプの作成に失敗しました。', 'error');
    }
  };

  // ユーザーを削除
  const handleRemoveInvitedUser = async (userId: string) => {
    try {
      await deleteUserFromGroup(groupId, userId);
      setInvitedUsers((prev) => prev.filter((user) => user.id !== userId));
      showMessage('ユーザーが削除されました。', 'success');
    } catch (error) {
      console.error('Error removing user:', error);
      showMessage('ユーザーの削除に失敗しました。', 'error');
    }
  };

  return (
    <div className="p-4 relative">
      <h2 className="text-lg font-bold mb-2">招待者を選択</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="ユーザー名で検索"
        className={`w-full p-2 border rounded ${
          suggestedUsers.length > 0 ? 'mb-2' : 'mb-10'
        }`}
      />
      {suggestedUsers.length > 0 && (
        <div className="border rounded shadow-lgs bg-content mb-10">
          <ul className="divide-y divide-gray-200">
            {suggestedUsers.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                onClick={() => handleSelectUser(user)}
              >
                <span className="font-medium">{user.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <h3 className="text-md font-bold mb-2">招待されたユーザー</h3>
      <ul className="divide-y divide-wood-lightest/20 space-y-[5px] mb-4">
        {invitedUsers.map((user) => (
          <li
            key={user.id}
            className="shadow-2xl rounded-2xl overflow-hidden border border-wood-lightest/20 hover:bg-content-secondary/50 bg-content transition-colors duration-200 flex items-center p-4"
          >
            <div className="flex-1 flex items-center">
              <span className="flex-1 text-wood-darkest">
                <span className="font-medium">{user.username}</span>
              </span>
            </div>
            <button
              onClick={() => handleRemoveInvitedUser(user.id)}
              className="text-red-500 hover:underline ml-2"
            >
              <CiSquareRemove className="text-[25px] text-red-500" />
            </button>
          </li>
        ))}
      </ul>
      {selectedUsers.length > 0 && (
        <>
          <h3 className="text-md font-bold mb-2">選択されたユーザー</h3>
          <ul className="divide-y divide-wood-lightest/20 space-y-[5px]">
            {selectedUsers.map((user) => (
              <li
                key={user.id}
                className="shadow-2xl rounded-2xl overflow-hidden border border-wood-lightest/20 hover:bg-content-secondary/50 bg-content transition-colors duration-200 flex items-center p-4"
              >
                <div className="flex-1 flex items-center">
                  <span className="flex-1 text-wood-darkest">
                    <span className="font-medium">{user.username}</span>
                  </span>
                </div>
                <button
                  onClick={() =>
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id)
                    )
                  }
                >
                  <CiSquareRemove className="text-[25px] text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <button
        onClick={handleInvite}
        className="mt-4 p-2 bg-blue-500 text-white rounded"
      >
        招待
      </button>
      <button
        onClick={() => router.push(`/prototypes/groups/${groupId}`)}
        className="mt-4 ml-2 p-2 bg-gray-500 text-white rounded"
      >
        戻る
      </button>
    </div>
  );
};

export default PlayerInvite;
