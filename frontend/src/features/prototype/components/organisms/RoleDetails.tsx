'use client';

import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import { FaUserShield, FaEdit, FaGamepad, FaEye } from 'react-icons/fa';
import { IoArrowBack } from 'react-icons/io5';

import { ROLE_TYPE } from '@/constants/roles';

const RoleDetails: React.FC = () => {
  const router = useRouter();
  const { groupId } = useParams<{ groupId: string }>();

  const roleDefinitions = [
    {
      id: ROLE_TYPE.ADMIN,
      name: 'Admin',
      description: 'プロトタイプの管理者権限を持ちます',
      icon: <FaUserShield className="h-6 w-6 text-red-600" />,
      permissions: [
        'プロトタイプの削除',
        'ユーザーの招待・除外',
        'ロールの変更',
        'プロトタイプの編集',
        'プロトタイプのプレイ',
      ],
    },
    {
      id: ROLE_TYPE.EDITOR,
      name: 'Editor',
      description: 'プロトタイプの編集権限を持ちます',
      icon: <FaEdit className="h-6 w-6 text-blue-600" />,
      permissions: ['プロトタイプの編集', 'プロトタイプのプレイ'],
    },
    {
      id: ROLE_TYPE.PLAYER,
      name: 'Player',
      description: 'プロトタイプのプレイ権限を持ちます',
      icon: <FaGamepad className="h-6 w-6 text-green-600" />,
      permissions: ['プロトタイプのプレイ', 'パーツの操作'],
    },
    {
      id: ROLE_TYPE.VIEWER,
      name: 'Viewer',
      description: 'プロトタイプの閲覧権限のみを持ちます',
      icon: <FaEye className="h-6 w-6 text-gray-600" />,
      permissions: ['プロトタイプの閲覧'],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow mt-16">
      <div className="flex items-center relative mb-6">
        <button
          onClick={() => router.push(`/groups/${groupId}/roles`)}
          className="p-2 hover:bg-content-secondary rounded-full transition-colors absolute left-0"
          title="ロール管理へ戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <h2 className="text-xl font-bold w-full text-center">ロール詳細</h2>
      </div>

      <div className="mb-6">
        <p className="text-center text-wood-dark">
          プロトタイプで利用可能なロールと権限の詳細です。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {roleDefinitions.map((role) => (
          <div
            key={role.id}
            className="bg-content border border-wood-lightest/20 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              {role.icon}
              <div>
                <h3 className="text-lg font-semibold text-wood-dark">
                  {role.name}
                </h3>
                <p className="text-sm text-wood">{role.description}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-wood-dark mb-2">権限一覧</h4>
              <ul className="space-y-2">
                {role.permissions.map((permission, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-wood"
                  >
                    <span className="w-2 h-2 bg-wood-light rounded-full flex-shrink-0"></span>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleDetails;
