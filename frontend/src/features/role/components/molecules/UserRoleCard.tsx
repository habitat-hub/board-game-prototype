import React from 'react';
import { AiOutlineUserSwitch } from 'react-icons/ai';
import { FaInfoCircle, FaTrash } from 'react-icons/fa';

import RoleBadge from '../atoms/RoleBadge';
import UserAvatar from '../atoms/UserAvatar';

interface UserRoleWithDetails {
  userId: string;
  user: {
    id: string;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
  roles: Array<{ name: string; description: string }>;
}

interface UserRoleCardProps {
  userRole: UserRoleWithDetails;
  isCreator: boolean;
  isSelf: boolean;
  isLastAdmin: boolean;
  canRemove: boolean;
  removeReason: string;
  onEdit: (userId: string, username: string, roleName: string) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  editMode: boolean;
}

/**
 * 編集ボタンのタイトルを返す
 * @returns タイトル文字列
 */
const getEditButtonTitle = ({
  isCreator,
  isSelf,
  loading,
  editMode,
}: {
  isCreator: boolean;
  isSelf: boolean;
  loading: boolean;
  editMode: boolean;
}): string => {
  // プロジェクト作成者の場合
  if (isCreator) return 'プロジェクト作成者の権限は変更できません';
  // 自分自身の場合
  if (isSelf) return '自分の権限は変更できません';
  // ローディング中の場合
  if (loading) return '処理中...';
  // 編集モード中の場合
  if (editMode) return '編集モード中は変更できません';
  return '権限を変更';
};

const getRemoveButtonTitle = ({
  canRemove,
  removeReason,
  loading,
  editMode,
}: {
  canRemove: boolean;
  removeReason: string;
  loading: boolean;
  editMode: boolean;
}) => {
  if (loading) return '処理中...';
  if (editMode) return '編集モード中は削除できません';
  if (canRemove) return '権限を削除';
  return removeReason;
};

const UserRoleCard: React.FC<UserRoleCardProps> = ({
  userRole,
  isCreator,
  isSelf,
  isLastAdmin: _isLastAdmin, // 現在未使用のため_プレフィックスを追加
  canRemove,
  removeReason,
  onEdit,
  onRemove,
  loading,
  editMode,
}) => {
  const primaryRole = userRole.roles[0];
  const editTitle = getEditButtonTitle({
    isCreator,
    isSelf,
    loading,
    editMode,
  });
  const removeTitle = getRemoveButtonTitle({
    canRemove,
    removeReason,
    loading,
    editMode,
  });

  return (
    <div
      className={`bg-kibako-white border border-kibako-secondary/20 rounded-lg p-4 transition-all ${
        !editMode ? 'hover:shadow-md' : ''
      } ${loading ? 'opacity-60' : ''}`}
    >
      {/* ヘッダー：ユーザー情報 */}
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar username={userRole.user.username} size="lg" />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium text-kibako-primary">
              {userRole.user.username}
            </div>
          </div>

          {/* 現在の権限表示 */}
          <div className="mt-1">
            <RoleBadge roleName={primaryRole.name} />
          </div>
        </div>

        {/* アクションボタン群 */}
        <div className="flex gap-1">
          {/* 変更ボタン */}
          <button
            onClick={() =>
              onEdit(userRole.userId, userRole.user.username, primaryRole.name)
            }
            className={`p-2 rounded transition-colors ${
              !isCreator && !isSelf && !loading && !editMode
                ? 'text-kibako-primary/60 hover:text-kibako-secondary hover:bg-kibako-tertiary/40'
                : 'text-kibako-secondary/50 cursor-not-allowed'
            }`}
            title={editTitle}
            aria-label={editTitle}
            disabled={loading || isCreator || isSelf || editMode}
          >
            <AiOutlineUserSwitch className="h-4 w-4" />
          </button>

          {/* 削除ボタン */}
          <button
            type="button"
            onClick={() => onRemove(userRole.userId)}
            className={`p-2 rounded transition-colors ${
              canRemove && !loading && !editMode
                ? 'text-kibako-primary/60 hover:text-kibako-danger hover:bg-kibako-danger/30'
                : 'text-kibako-secondary/50 cursor-not-allowed'
            }`}
            title={removeTitle}
            aria-label={removeTitle}
            disabled={loading || !canRemove || editMode}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kibako-secondary"></div>
            ) : (
              <FaTrash className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 複数権限がある場合の表示 */}
      {userRole.roles.length > 1 && (
        <div className="mt-3 pt-3 border-t border-kibako-secondary/10">
          <div className="text-xs text-kibako-primary/70">
            その他の権限:{' '}
            {userRole.roles
              .slice(1)
              .map((role) => role.name)
              .join(', ')}
          </div>
        </div>
      )}

      {/* 制限の説明 */}
      {isCreator && (
        <div className="mt-3 pt-3 border-t border-kibako-secondary/10">
          <div className="text-xs text-kibako-primary/70 flex items-center gap-1">
            <div>
              <div className="text-kibako-accent font-medium">
                プロジェクト作成者
              </div>
              <div className="flex items-center gap-1">
                <FaInfoCircle className="h-3 w-3" />
                <span>権限は変更できません</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleCard;
