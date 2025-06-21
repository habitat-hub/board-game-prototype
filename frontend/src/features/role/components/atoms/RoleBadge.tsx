import React from 'react';
import { FaUserShield, FaEdit, FaEye } from 'react-icons/fa';

interface RoleBadgeProps {
  roleName: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({
  roleName,
  showIcon = true,
  size = 'md',
}) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: <FaUserShield className="h-3 w-3" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          label: 'Admin',
        };
      case 'editor':
        return {
          icon: <FaEdit className="h-3 w-3" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          label: 'Editor',
        };
      case 'viewer':
        return {
          icon: <FaEye className="h-3 w-3" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          label: 'Viewer',
        };
      default:
        return {
          icon: <FaEye className="h-3 w-3" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          label: role.charAt(0).toUpperCase() + role.slice(1),
        };
    }
  };

  const config = getRoleConfig(roleName);
  const sizeClasses =
    size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <div className="flex items-center gap-1.5">
      {showIcon && <div className={config.textColor}>{config.icon}</div>}
      <span
        className={`${sizeClasses} rounded font-medium ${config.bgColor} ${config.textColor}`}
      >
        {config.label}
      </span>
    </div>
  );
};

export default RoleBadge;
