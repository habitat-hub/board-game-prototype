import { useState, useCallback } from 'react';

import { Part } from '@/api/types';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';

/**
 * カードの状態を管理するフック
 * @param part - パーツ
 * @param ref - Partコンポーネントのref
 * @returns カードの状態
 */
export const useCard = (part: Part) => {
  const { dispatch } = usePartReducer();
  const { measureOperation } = usePerformanceTracker();
  // カードが反転中かどうか
  const [isReversing, setIsReversing] = useState(false);

  /**
   * カードを反転させる
   * @param isNextFlipped - 次に裏返しにするかどうか
   */
  const handleReverseCard = useCallback(
    (nextFrontSide: 'front' | 'back', needsSocketEmit: boolean) => {
      // カードでない場合
      if (part.type !== 'card') return;
      // 反転が不要な場合
      if (part.frontSide === nextFrontSide) return;

      measureOperation('Card Flip', () => {
        // 反転させる
        setIsReversing(true);

        // ソケットをemitする場合は UPDATE_PART を送る（frontSide を更新）
        if (needsSocketEmit) {
          dispatch({
            type: 'UPDATE_PART',
            payload: {
              partId: part.id,
              updatePart: { frontSide: nextFrontSide },
            },
          });
        }
      });
    },
    [part.type, part.frontSide, part.id, measureOperation, dispatch]
  );

  const reverseCard = (
    nextFrontSide: 'front' | 'back',
    needsSocketEmit = false
  ) => {
    handleReverseCard(nextFrontSide, needsSocketEmit);
  };

  return {
    isReversing,
    setIsReversing,
    reverseCard,
  };
};
