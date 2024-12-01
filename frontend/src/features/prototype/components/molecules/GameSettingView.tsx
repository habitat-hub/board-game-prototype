import React, { useMemo } from 'react';
import { Player, User } from '@/features/prototype/type';

interface GameSettingsViewProps {
  players: Player[];
  accessibleUsers: User[];
  onUserChange: (playerId: number, userId: number | null) => void;
}

const GameSettingsView: React.FC<GameSettingsViewProps> = ({
  players,
  accessibleUsers,
  onUserChange,
}) => {
  const userAssignments = useMemo(
    () =>
      players.reduce((acc, player) => {
        if (!player.userId) {
          return acc;
        }

        acc[player.id] = player.userId;
        return acc;
      }, {} as { [key: number]: number }),
    [players]
  );

  /**
   * プレイヤーにユーザーを割り当てる
   * @param playerId - プレイヤーのID
   * @param userId - ユーザーのID
   */
  const handleUserSelect = (playerId: number, userId: number | null) => {
    onUserChange(playerId, userId);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">ゲーム設定</h2>
      {players
        .sort((a, b) => a.order - b.order)
        .map((player) => (
          <div key={player.id} className="mb-4">
            <label className="block mb-1">{player.name}</label>
            <select
              value={userAssignments[player.id] || ''}
              onChange={(e) =>
                handleUserSelect(player.id, parseInt(e.target.value) || null)
              }
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">ユーザーを選択してください</option>
              {accessibleUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
        ))}
    </div>
  );
};

export default GameSettingsView;
