import { useImperativeHandle, useState } from 'react';

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
  // カードが裏返しになっているかどうか
  const [isFlipped, setIsFlipped] = useState(part.isFlipped);
  // カードが反転中かどうか
  const [isReversing, setIsReversing] = useState(false);

  /**
   * カードを反転させる
   * @param isNextFlipped - 次に裏返しにするかどうか
   */
  const handleReverseCard = (
    isNextFlipped: boolean,
    needsSocketEmit: boolean
  ) => {
    measureOperation('Card Flip', () => {
      // カードでない場合
      if (part.type !== 'card') return;
      // 反転不可の場合
      if (!part.isReversible) return;
      // 反転が不要な場合
      if (isFlipped === isNextFlipped) return;

      // 反転させる
      setIsReversing(true);
      setIsFlipped(isNextFlipped);

      // ソケットをemitする場合
      if (needsSocketEmit) {
        dispatch({
          type: 'FLIP_CARD',
          payload: { cardId: part.id, isNextFlipped },
        });
      }
    });
  };

  // 外部から呼び出せる関数を定義    // 外部から呼び出せる関数を定義
  useImperativeHandle(ref, () => ({
    reverseCard: (isNextFlipped: boolean, needsSocketEmit = false) => {
      handleReverseCard(isNextFlipped, needsSocketEmit);
    },
  }));

  return {
    isFlipped,
    isReversing,
    setIsReversing,
    reverseCard: handleReverseCard,
  };
};
