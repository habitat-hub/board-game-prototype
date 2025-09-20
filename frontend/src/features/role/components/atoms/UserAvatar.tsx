import React from 'react';

interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'subtle';
}

const variantStyles = {
  default: {
    container:
      'bg-gradient-to-br from-kibako-accent to-kibako-primary text-kibako-white ring-2 ring-kibako-white/80 ring-offset-2 ring-offset-kibako-tertiary shadow-sm',
  },
  subtle: {
    container:
      'bg-kibako-secondary text-kibako-primary ring-0 ring-offset-0 shadow-none',
  },
} as const;

const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  size = 'md',
  className = '',
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  const normalizedUsername = username.trim();
  const { container } = variantStyles[variant] ?? variantStyles.default;
  const initial = normalizedUsername.charAt(0).toUpperCase() || '?';

  return (
    <div
      className={`${container} rounded-full flex items-center justify-center font-semibold uppercase ${sizeClasses[size]} ${className}`}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
