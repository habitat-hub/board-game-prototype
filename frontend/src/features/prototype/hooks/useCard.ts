import { useImperativeHandle, useState, useCallback } from 'react';

import { Part } from '@/api/types';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { PartHandle } from '@/features/prototype/type';

/**
 * カードの状態を管理するフック
 * @param part - パーツ
 * @param ref - Partコンポーネントのref
 * @returns カードの状態
 */
export const useCard = (part: Part, ref: React.ForwardedRef<PartHandle>) => {
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

        // ソケットをemitする場合
        if (needsSocketEmit) {
          dispatch({
            type: 'FLIP_CARD',
            payload: { cardId: part.id, nextFrontSide },
          });
        }
      });
    },
    [part.type, part.frontSide, part.id, measureOperation, dispatch]
  );

  // 外部から呼び出せる関数を定義    // 外部から呼び出せる関数を定義
  useImperativeHandle(ref, () => ({
    reverseCard: (nextFrontSide: 'front' | 'back', needsSocketEmit = false) => {
      handleReverseCard(nextFrontSide, needsSocketEmit);
    },
  }));

  return {
    isReversing,
    setIsReversing,
    reverseCard: handleReverseCard,
  };
};
