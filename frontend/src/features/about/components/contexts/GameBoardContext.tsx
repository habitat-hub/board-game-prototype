'use client';

import React, { createContext, useContext } from 'react';

// ゲームボード要素の参照を共有するためのContext
const GameBoardContext = createContext<React.RefObject<HTMLDivElement> | null>(
  null
);

// 使いやすいようにカスタムフックを提供
export const useGameBoard = () => useContext(GameBoardContext);

// ContextのProviderコンポーネント
export const GameBoardProvider: React.FC<{
  children: React.ReactNode;
  boardRef: React.RefObject<HTMLDivElement>;
}> = ({ children, boardRef }) => {
  return (
    <GameBoardContext.Provider value={boardRef}>
      {children}
    </GameBoardContext.Provider>
  );
};

export default GameBoardContext;
