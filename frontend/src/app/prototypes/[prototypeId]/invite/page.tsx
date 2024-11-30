'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/features/prototype/type';
import { useParams, useRouter } from 'next/navigation';

export const runtime = 'edge';
const InvitePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { prototypeId } = useParams();

  useEffect(() => {
    if (searchTerm) {
      // メールアドレスでユーザーを検索
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      fetch(
        `${apiUrl}/api/users/search?username=${encodeURIComponent(searchTerm)}`,
        {
          credentials: 'include',
        }
      )
        .then((response) => response.json())
        .then((data) => setSuggestedUsers(data));
    } else {
      setSuggestedUsers([]);
    }
  }, [searchTerm]);

  const handleSelectUser = (user: User) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSearchTerm('');
      setSuggestedUsers([]);
      return;
    }

    setSelectedUsers((prev) => [...prev, user]);
    setSearchTerm('');
    setSuggestedUsers([]);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      setError('ユーザーを選択してください。');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/prototypes/${prototypeId}/invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guestIds: selectedUsers.map((user) => user.id),
          }),
          credentials: 'include',
        }
      );

      if (response.ok) {
        setSelectedUsers([]);
        setSearchTerm('');
        setError(null);
        setSuccessMessage('招待が成功しました！');
        setTimeout(() => {
          router.push(`/prototypes/${prototypeId}/edit`);
        }, 2000);
      } else {
        const errorMessage = await response.text();
        setError(`プロトタイプの作成に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating prototype:', error);
      setError('エラーが発生しました。');
    }
  };

  const handleBack = () => {
    router.push(`/prototypes/${prototypeId}/edit`);
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
      <h3 className="text-md font-bold mb-2">選択されたユーザー</h3>
      <ul>
        {selectedUsers.map((user) => (
          <li key={user.id} className="mb-2">
            {user.username}
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
        onClick={handleBack}
        className="mt-4 ml-2 p-2 bg-gray-500 text-white rounded"
      >
        戻る
      </button>
    </div>
  );
};

export default InvitePage;
