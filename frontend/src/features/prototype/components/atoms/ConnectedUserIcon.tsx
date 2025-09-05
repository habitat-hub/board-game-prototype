import { ConnectedUser } from '@/features/prototype/types';
import { getUserColor } from '@/features/prototype/utils/userColor';

interface ConnectedUserIconProps {
  user: ConnectedUser;
  users: ConnectedUser[];
  index?: number;
}

export default function ConnectedUserIcon({
  user,
  users,
  index = 0,
}: ConnectedUserIconProps) {
  const color = getUserColor(user.userId, users);
  return (
    <span
      className="flex items-center justify-center w-7 h-7 rounded-full bg-kibako-white text-kibako-primary font-bold text-sm select-none border-2 shadow-sm"
      style={{ zIndex: 10 - index, borderColor: color }}
      title={user.username}
    >
      {user.username.charAt(0).toUpperCase()}
    </span>
  );
}
