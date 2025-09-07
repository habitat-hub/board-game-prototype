import React from 'react';
import { FaUserShield, FaEdit, FaEye } from 'react-icons/fa';

interface RoleBadgeProps {
  roleName: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const getRoleConfig = (role: string) => {
  switch (role) {
    case 'admin':
      return {
        icon: <FaUserShield className="h-3 w-3" />,
        bgColor: 'bg-kibako-danger/10',
        textColor: 'text-kibako-danger/80',
        label: 'Admin',
      };
    case 'editor':
      return {
        icon: <FaEdit className="h-3 w-3" />,
        bgColor: 'bg-kibako-info/10',
        textColor: 'text-kibako-info/80',
        label: 'Editor',
      };
    case 'viewer':
      return {
        icon: <FaEye className="h-3 w-3" />,
        bgColor: 'bg-kibako-tertiary/20',
        textColor: 'text-kibako-primary/80',
        label: 'Viewer',
      };
    default:
      return {
        icon: <FaEye className="h-3 w-3" />,
        bgColor: 'bg-kibako-tertiary/20',
        textColor: 'text-kibako-primary/80',
        label: role.charAt(0).toUpperCase() + role.slice(1),
      };
  }
};

const RoleBadge: React.FC<RoleBadgeProps> = ({
  roleName,
  showIcon = true,
  size = 'md',
}) => {
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
