import React from 'react';

interface UserAvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  username,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={`bg-gradient-to-br from-wood-light to-wood rounded-full flex items-center justify-center text-white font-medium ${sizeClasses[size]} ${className}`}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
};

export default UserAvatar;
