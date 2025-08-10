import React from 'react';

import { useSocketConnection } from '@/features/prototype/hooks/useSocketConnection';
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
  const { partsMap, propertiesMap, cursors, connectedUsers } =
    useSocketConnection({
      prototypeId,
      userId,
    });

  return (
    <GameBoard
      prototypeName={prototypeName}
      partsMap={partsMap}
      propertiesMap={propertiesMap}
      cursors={cursors}
      projectId={projectId}
      gameBoardMode={gameBoardMode}
      connectedUsers={connectedUsers}
    />
  );
};

export default SocketGameBoard;
