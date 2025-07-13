import React from 'react';

import { useSocketConnection } from '@/features/prototype/hooks/useSocketConnection';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';

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
  const { socket, partsMap, propertiesMap, cursors } = useSocketConnection({
    prototypeId,
    userId,
  });

  if (!socket) return null;

  return (
    <GameBoard
      prototypeName={prototypeName}
      partsMap={partsMap}
      propertiesMap={propertiesMap}
      cursors={cursors}
      projectId={projectId}
      gameBoardMode={gameBoardMode}
    />
  );
};

export default SocketGameBoard;
