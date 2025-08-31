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
  isLastAdmin: boolean;
  canRemove: boolean;
  removeReason: string;
  onEdit: (userId: string, username: string, roleName: string) => void;
  onRemove: (userId: string) => void;
  loading: boolean;
  editMode: boolean;
}

const UserRoleCard: React.FC<UserRoleCardProps> = ({
  userRole,
  isCreator,
  isLastAdmin: _isLastAdmin, // 現在未使用のため_プレフィックスを追加
  canRemove,
  removeReason,
  onEdit: _onEdit, // 現在未使用のため_プレフィックスを追加
  onRemove,
  loading,
  editMode,
}) => {
  const primaryRole = userRole.roles[0];

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
            onClick={() => {
              // 現在は無効化されているため何もしない
            }}
            className="p-2 rounded transition-colors text-kibako-secondary/50 cursor-not-allowed"
            title={
              isCreator
                ? 'プロジェクト作成者の権限は変更できません'
                : '権限を変更する - Coming Soon 開発中です'
            }
            disabled={true}
          >
            <AiOutlineUserSwitch className="h-4 w-4" />
          </button>

          {/* 削除ボタン */}
          <button
            onClick={() => onRemove(userRole.userId)}
            className={`p-2 rounded transition-colors ${
              canRemove && !loading && !editMode
                ? 'text-kibako-primary/60 hover:text-kibako-danger hover:bg-kibako-danger/10'
                : 'text-kibako-secondary/50 cursor-not-allowed'
            }`}
            title={
              loading
                ? '処理中...'
                : editMode
                  ? '編集モード中は削除できません'
                  : canRemove
                    ? '権限を削除'
                    : removeReason
            }
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
