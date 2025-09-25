import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaUserShield } from 'react-icons/fa';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi';

import { ROLE_LABELS } from '@/constants/roles';
import RoleSelect from '@/features/role/components/atoms/RoleSelect';
import type { RoleValue } from '@/features/role/types';

import UserSearchDropdown from './UserSearchDropdown';

interface User {
  id: string;
  username: string;
}

interface RoleManagementFormProps {
  // ユーザー検索
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onClearUser: () => void;
  showUserDropdown: boolean;
  onToggleUserDropdown: (show: boolean) => void;
  filteredUsers: User[];

  // ロール選択
  selectedRole: 'admin' | 'editor' | 'viewer';
  onRoleChange: (role: 'admin' | 'editor' | 'viewer') => void;

  // アクション
  onAddRole: () => void;
  loading: boolean;
  canManageRole: boolean;
}

const RoleManagementForm: React.FC<RoleManagementFormProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedUser,
  onUserSelect,
  onClearUser,
  showUserDropdown,
  onToggleUserDropdown,
  filteredUsers,
  selectedRole,
  onRoleChange,
  onAddRole,
  loading,
  canManageRole,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement | null>(null);
  const helpPopoverRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();
  const helpPopoverId = useId();

  const roleHelpItems = useMemo(
    () =>
      [
        {
          value: 'admin',
          label: ROLE_LABELS.admin,
          summary: '管理者権限',
          description:
            'プロトタイプ削除、ユーザー管理、権限変更、設定管理など全ての操作が可能です',
          icon: <FaUserShield className="h-4 w-4" />,
          iconColor: 'text-kibako-danger',
        },
        {
          value: 'editor',
          label: ROLE_LABELS.editor,
          summary: '編集権限',
          description: 'プロジェクト内のパーツやルームを編集できます',
          icon: <FaEdit className="h-4 w-4" />,
          iconColor: 'text-kibako-info',
        },
        {
          value: 'viewer',
          label: ROLE_LABELS.viewer,
          summary: '閲覧のみ',
          description: 'プロジェクトを閲覧できますが編集はできません',
          icon: <FaEye className="h-4 w-4" />,
          iconColor: 'text-kibako-primary',
        },
      ] satisfies Array<{
        value: RoleValue;
        label: string;
        summary: string;
        description: string;
        icon: React.ReactElement;
        iconColor: string;
      }>,
    []
  );

  useEffect(() => {
    if (!isHelpOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (helpButtonRef.current?.contains(target)) return;
      if (helpPopoverRef.current?.contains(target)) return;
      setIsHelpOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHelpOpen]);

  return (
    <div className="mb-4">
      <div
        className={`bg-kibako-tertiary/20 border border-kibako-secondary/20 rounded-lg p-3 ${
          canManageRole ? '' : 'opacity-50 pointer-events-none'
        }`}
      >
        {/* ヘッダー */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-kibako-primary">
              新しいユーザーを追加
            </h3>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          {/* ユーザー検索 */}
          <div className="flex-1 min-w-0">
            <UserSearchDropdown
              searchTerm={searchTerm}
              onSearchChange={onSearchTermChange}
              selectedUser={selectedUser}
              onUserSelect={onUserSelect}
              onClearUser={onClearUser}
              showDropdown={showUserDropdown}
              onToggleDropdown={onToggleUserDropdown}
              filteredUsers={filteredUsers}
              loading={loading}
            />
          </div>

          {/* 権限選択 */}
          <div className="md:w-48 w-full">
            <div className="flex items-center gap-1 mb-1">
              <label
                id={labelId}
                className="block text-sm font-medium text-kibako-primary"
              >
                権限
              </label>
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  ref={helpButtonRef}
                  aria-expanded={isHelpOpen}
                  aria-controls={helpPopoverId}
                  onClick={() => setIsHelpOpen((prev) => !prev)}
                  className="p-1 text-kibako-secondary/80 hover:text-kibako-primary transition-colors"
                >
                  <span className="sr-only">権限の説明を表示</span>
                  <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                </button>
                {isHelpOpen && (
                  <div
                    ref={helpPopoverRef}
                    id={helpPopoverId}
                    role="dialog"
                    aria-label="権限の説明"
                    className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-kibako-secondary/30 bg-kibako-white p-3 shadow-lg"
                  >
                    <p className="mb-2 text-sm font-semibold text-kibako-primary">
                      権限の説明
                    </p>
                    <ul className="space-y-2 text-xs text-kibako-secondary">
                      {roleHelpItems.map((item) => (
                        <li key={item.value} className="flex gap-2">
                          <span className={`${item.iconColor} mt-0.5`}>
                            {item.icon}
                          </span>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-kibako-primary">
                              {item.label}
                            </p>
                            <p>{item.summary}</p>
                            <p className="text-[11px] leading-snug text-kibako-secondary/90">
                              {item.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <RoleSelect
              value={selectedRole}
              onChange={onRoleChange}
              disabled={loading || !canManageRole}
              title={
                !canManageRole
                  ? '権限変更する権限がありません'
                  : '付与する権限を選択'
              }
              aria-labelledby={labelId}
              className="w-full"
            />
          </div>

          {/* 追加ボタン */}
          <div className="md:w-auto w-full">
            <label className="block text-sm font-medium text-transparent mb-1 select-none">
              追加
            </label>
            <button
              type="button"
              onClick={onAddRole}
              disabled={!selectedUser || loading || !canManageRole}
              className="w-full md:w-auto px-6 py-2 bg-kibako-secondary hover:bg-kibako-secondary text-kibako-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-kibako-white"></div>
                  <span className="text-sm">追加中...</span>
                </>
              ) : (
                <>
                  <FaPlus className="h-3 w-3" />
                  <span className="text-sm">追加</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementForm;
