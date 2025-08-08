'use client';

import { useState, useEffect } from 'react';

import { useGameBoard } from '../components/contexts/GameBoardContext';
import { useGamePiece } from '../components/contexts/GamePieceContext';

// ボード内のランダムな位置を生成するカスタムフック
export function useRandomPosition(id: string, width: string, height: string) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const boardRef = useGameBoard();
  const piecesContext = useGamePiece();

  // このピース用のrefを登録
  const pieceRef = piecesContext?.registerRef(id, width, height);

  useEffect(() => {
    const calculateRandomPosition = () => {
      const boardElement = boardRef?.current;
      if (boardElement) {
        const boardRect = boardElement.getBoundingClientRect();

        // pieceRefが設定されている場合はそれを使用する、まだ設定されていない場合は従来の方法でサイズを取得
        let pieceWidth = 64; // デフォルト値
        let pieceHeight = 64; // デフォルト値

        if (pieceRef?.current) {
          const pieceRect = pieceRef.current.getBoundingClientRect();
          pieceWidth = pieceRect.width;
          pieceHeight = pieceRect.height;
        } else {
          // ピースがまだレンダリングされていない場合のフォールバック
          const pieceElements = boardElement.querySelectorAll(
            `.${width}.${height}`
          );
          const pieceRect = pieceElements[0]?.getBoundingClientRect();
          pieceWidth = pieceRect?.width || pieceWidth;
          pieceHeight = pieceRect?.height || pieceHeight;
        }

        // ボードの余白を考慮
        const buffer = 10;

        // ランダムな位置を計算（ボード内に収まるように）
        const randomX =
          Math.floor(
            Math.random() * (boardRect.width - pieceWidth - buffer * 2)
          ) + buffer;
        const randomY =
          Math.floor(
            Math.random() * (boardRect.height - pieceHeight - buffer * 2)
          ) + buffer;

        setPosition({ x: randomX, y: randomY });
      }
    };

    // 少し遅延を入れてDOMが確実にレンダリングされた後に実行
    const timer = setTimeout(calculateRandomPosition, 100);

    return () => clearTimeout(timer);
  }, [width, height, boardRef, pieceRef]);

  return position;
}
