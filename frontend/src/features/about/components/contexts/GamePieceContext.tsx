'use client';

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from 'react';

// ゲームピース要素の参照を動的に管理するためのContext
export type GamePieceRefMap = Map<string, React.RefObject<HTMLDivElement | null>>;

export interface GamePieceContextType {
  refs: GamePieceRefMap;
  registerRef: (
    id: string,
    width: string,
    height: string
  ) => React.RefObject<HTMLDivElement | null>;
}

// GamePieceContextの作成
const GamePieceContext = createContext<GamePieceContextType | null>(null);

// 使いやすいようにカスタムフックを提供
export const useGamePiece = () => useContext(GamePieceContext);

// ピース要素のRefMapを提供するカスタムProvider
export const GamePieceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pieceRefs = useRef<GamePieceRefMap>(new Map());

  const registerRef = useCallback(
    (id: string, width: string, height: string) => {
      // 既に存在する場合はそれを返す
      const existingKey = `${id}-${width}-${height}`;
      if (pieceRefs.current.has(existingKey)) {
        return pieceRefs.current.get(existingKey)!;
      }

      // 新しいrefを作成して登録
      const newRef = React.createRef<HTMLDivElement>();
      pieceRefs.current.set(existingKey, newRef);
      return newRef;
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      refs: pieceRefs.current,
      registerRef,
    }),
    [registerRef]
  );

  return (
    <GamePieceContext.Provider value={contextValue}>
      {children}
    </GamePieceContext.Provider>
  );
};

export default GamePieceContext;
