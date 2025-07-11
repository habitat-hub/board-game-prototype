import React from 'react';
import { FaUserShield, FaEdit, FaEye } from 'react-icons/fa';

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
      name: 'Viewer',
      icon: <FaEye className="h-6 w-6" />,
      color: 'text-gray-400',
      description: 'Coming Soon',
      detailDescription: '現在開発中です',
      disabled: true,
    },
    {
      value: 'editor',
      name: 'Editor',
      icon: <FaEdit className="h-6 w-6" />,
      color: 'text-gray-400',
      description: 'Coming Soon',
      detailDescription: '現在開発中です',
      disabled: true,
    },
    {
      value: 'admin',
      name: 'Admin',
      icon: <FaUserShield className="h-6 w-6" />,
      color: 'text-red-600',
      description: '全ての管理権限を持つ最高権限',
      detailDescription: 'プロトタイプ削除、ユーザー管理、権限変更、設定管理',
      disabled: false,
    },
  ] as const;

  return (
    <div>
      <label className="block text-sm font-medium text-wood-dark mb-1">
        権限選択
      </label>
      <div className="flex gap-3">
        {roles.map((role) => (
          <label
            key={role.value}
            className={`flex-1 flex flex-col gap-2 p-3 border rounded-lg transition-all ${
              role.disabled
                ? 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50'
                : selectedRole === role.value
                  ? 'border-wood-light bg-blue-50 shadow-sm cursor-pointer'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
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
              <div className="text-base font-bold text-wood-dark">
                {role.name}
              </div>
            </div>
            {/* 下部：説明 */}
            <div className="text-center">
              <div className="text-xs font-medium text-wood-dark mb-1">
                {role.description}
              </div>
              <div className="text-[10px] text-wood leading-tight">
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
