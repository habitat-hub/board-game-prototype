'use client';

import { AxiosResponse } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

import {
  GetAccessibleUsersResponse,
  GetSearchUsersResponse,
  User,
} from '@/types';
import axiosInstance from '@/utils/axiosInstance';

const PlayerInvite: React.FC = () => {
  const router = useRouter();
  const { groupId } = useParams();

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
   * 招待されているユーザーを取得
   */
  const fetchInvitedUsers = useCallback(async () => {
    const response: AxiosResponse<GetAccessibleUsersResponse> =
      await axiosInstance.get(`/api/prototypes/groups/${groupId}/accessUsers`);
    setInvitedUsers(response.data);
  }, [groupId]);

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

    axiosInstance
      .get(`/api/users/search?username=${encodeURIComponent(searchTerm)}`)
      .then((response: AxiosResponse<GetSearchUsersResponse>) => {
        setSuggestedUsers(response.data);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching users:', error);
        setError('ユーザーの検索に失敗しました。');
      });
  }, [searchTerm]);

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
      setError('ユーザーを選択してください。');
      return;
    }

    try {
      await axiosInstance.post(`/api/prototypes/groups/${groupId}/invite`, {
        guestIds: selectedUsers.map((user) => user.id),
      });

      setSelectedUsers([]);
      setSearchTerm('');
      setError(null);
      setSuccessMessage('招待が成功しました！');
      fetchInvitedUsers();
    } catch (error) {
      console.error('Error inviting users:', error);
      setError('プロトタイプの作成に失敗しました。');
    }
  };

  // ユーザーを削除
  const handleRemoveInvitedUser = async (userId: string) => {
    try {
      await axiosInstance.delete(
        `/api/prototypes/groups/${groupId}/invite/${userId}`
      );
      setInvitedUsers((prev) => prev.filter((user) => user.id !== userId));
      setSuccessMessage('ユーザーが削除されました。');
    } catch (error) {
      console.error('Error removing user:', error);
      setError('ユーザーの削除に失敗しました。');
    }
  };

  return (
    <div className="p-4">
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
        className="w-full p-2 border rounded mb-4"
      />
      <ul className="mb-4">
        {suggestedUsers.map((user) => (
          <li key={user.id} className="mb-2">
            <button
              onClick={() => handleSelectUser(user)}
              className="text-blue-500 hover:underline"
            >
              {user.username}
            </button>
          </li>
        ))}
      </ul>
      <h3 className="text-md font-bold mb-2">招待されたユーザー</h3>
      <ul className="mb-8">
        {invitedUsers.map((user) => (
          <li key={user.id} className="mb-2 flex justify-between items-center">
            {user.username}
            <button
              onClick={() => handleRemoveInvitedUser(user.id)}
              className="text-red-500 hover:underline ml-2"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      <h3 className="text-md font-bold mb-2">選択されたユーザー</h3>
      <ul className="mb-2">
        {selectedUsers.map((user) => (
          <li key={user.id} className="mb-2 flex justify-between items-center">
            {user.username}
            <button
              onClick={() =>
                setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))
              }
              className="text-red-500 hover:underline ml-2"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
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
