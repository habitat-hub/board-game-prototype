'use client';

import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import { FaSearch, FaPlus, FaMinus } from 'react-icons/fa';
import { IoArrowBack } from 'react-icons/io5';

import { useUserInvite } from '@/features/prototype/hooks/useUserInvite';

import { UserCard } from '../molecules/UserCard';

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
    prototypeOwnerId,
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
                    title="プロトタイプに招待"
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
              isOwner={user.id === prototypeOwnerId}
              actionButton={
                user.id === prototypeOwnerId ? (
                  <span className="inline-block text-sm font-medium px-2 py-1 rounded-md bg-amber-100 text-amber-700 whitespace-nowrap">
                    オーナー
                  </span>
                ) : (
                  <button
                    onClick={() => removeInvitedUser(user.id)}
                    className="p-2 text-wood hover:text-red-500 rounded-md hover:bg-wood-lightest/20 transition-colors"
                    title="プロトタイプから除外"
                  >
                    <FaMinus className="h-4 w-4" />
                  </button>
                )
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserInvite;
