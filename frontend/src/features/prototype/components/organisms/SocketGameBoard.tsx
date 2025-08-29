import React from 'react';

import { usePrototypeSocket } from '@/features/prototype/hooks/usePrototypeSocket';
import { GameBoardMode } from '@/features/prototype/types';

import GameBoard from './GameBoard';

interface SocketGameBoardProps {
  /** プロトタイプ名 */
  prototypeName: string;
  /** プロジェクトID */
  projectId: string;
  /** プロトタイプID */
  prototypeId: string;
  /** ユーザーID */
  userId: string;
  /** ゲームボードモード */
  gameBoardMode: GameBoardMode;
}

const SocketGameBoard: React.FC<SocketGameBoardProps> = ({
  prototypeName,
  projectId,
  prototypeId,
  userId,
  gameBoardMode,
}) => {
  const { partsMap, propertiesMap, connectedUsers } = usePrototypeSocket({
    prototypeId,
    userId,
  });

  return (
    <GameBoard
      prototypeName={prototypeName}
      prototypeId={prototypeId}
      partsMap={partsMap}
      propertiesMap={propertiesMap}
      projectId={projectId}
      gameBoardMode={gameBoardMode}
      connectedUsers={connectedUsers}
    />
  );
};

export default SocketGameBoard;
