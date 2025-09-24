import React from 'react';
import { FaUserShield, FaEdit, FaEye } from 'react-icons/fa';

import { ROLE_LABELS } from '@/constants/roles';

interface RoleSelectorProps {
  selectedRole: 'admin' | 'editor' | 'viewer';
  onRoleChange: (role: 'admin' | 'editor' | 'viewer') => void;
  loading?: boolean;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleChange,
  loading = false,
}) => {
  const roles = [
    {
      value: 'viewer',
      name: ROLE_LABELS.viewer,
      icon: <FaEye className="h-6 w-6" />,
      color: 'text-kibako-primary/60',
      description: '閲覧のみ',
      detailDescription: 'プロジェクトを閲覧できますが編集はできません',
      disabled: false,
    },
    {
      value: 'editor',
      name: ROLE_LABELS.editor,
      icon: <FaEdit className="h-6 w-6" />,
      color: 'text-kibako-info',
      description: '編集権限',
      detailDescription:
        'プロジェクトの内容を編集できますが権限変更はできません',
      disabled: false,
    },
    {
      value: 'admin',
      name: ROLE_LABELS.admin,
      icon: <FaUserShield className="h-6 w-6" />,
      color: 'text-kibako-danger',
      description: '全ての管理権限を持つ最高権限',
      detailDescription: 'プロトタイプ削除、ユーザー管理、権限変更、設定管理',
      disabled: false,
    },
  ] as const;

  return (
    <div>
      <label className="block text-sm font-medium text-kibako-primary mb-1">
        権限選択
      </label>
      <div className="flex gap-3">
        {roles.map((role) => (
          <label
            key={role.value}
            className={`flex-1 flex flex-col gap-2 p-3 border rounded-lg transition-all ${
              role.disabled
                ? 'cursor-not-allowed opacity-50 border-kibako-secondary/20 bg-kibako-tertiary/20'
                : selectedRole === role.value
                  ? 'border-kibako-secondary bg-kibako-info/10 shadow-sm cursor-pointer'
                  : 'border-kibako-secondary/20 hover:border-kibako-secondary/30 hover:bg-kibako-tertiary/20 cursor-pointer'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={selectedRole === role.value}
              onChange={(e) =>
                onRoleChange(e.target.value as 'admin' | 'editor' | 'viewer')
              }
              disabled={loading || role.disabled}
              className="sr-only"
            />
            {/* 上部：アイコンとロール名 */}
            <div className="flex items-center gap-2 justify-center">
              <div className={`${role.color} flex-shrink-0`}>{role.icon}</div>
              <div className="text-base font-bold text-kibako-primary">
                {role.name}
              </div>
            </div>
            {/* 下部：説明 */}
            <div className="text-center">
              <div className="text-xs font-medium text-kibako-primary mb-1">
                {role.description}
              </div>
              <div className="text-[10px] text-kibako-secondary leading-tight">
                {role.detailDescription}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
