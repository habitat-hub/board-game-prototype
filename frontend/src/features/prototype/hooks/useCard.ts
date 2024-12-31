import { useImperativeHandle, useState } from 'react';
import { Socket } from 'socket.io-client';

import { Part } from '@/types/models';
import { PART_TYPE } from '@/features/prototype/const';
import { PartHandle } from '@/features/prototype/type';
import { usePartOperations } from '@/features/prototype/hooks/usePartOperations';

/**
 * カードの状態を管理するフック
 * @param part - パーツ
 * @param ref - Partコンポーネントのref
 * @param socket - ソケット
 * @returns カードの状態
 */
export const useCard = (
  part: Part,
  ref: React.ForwardedRef<PartHandle>,
  socket: Socket
) => {
  // カードが裏返しになっているかどうか
  const [isFlipped, setIsFlipped] = useState(part.isFlipped);
  // カードが反転中かどうか
  const [isReversing, setIsReversing] = useState(false);

  const { reverseCard } = usePartOperations(part.prototypeVersionId, socket);

  /**
   * カードを反転させる
   * @param isNextFlipped - 次に裏返しにするかどうか
   */
  const handleReverseCard = (
    isNextFlipped: boolean,
    needsSocketEmit: boolean
  ) => {
    // カードでない場合
    if (part.type !== PART_TYPE.CARD) return;
    // 反転不可の場合
    if (!part.isReversible) return;
    // 反転が不要な場合
    if (isFlipped === isNextFlipped) return;

    // 反転させる
    setIsReversing(true);
    setIsFlipped(isNextFlipped);

    // ソケットをemitする場合
    if (needsSocketEmit) {
      reverseCard(part.id, isNextFlipped);
    }
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
