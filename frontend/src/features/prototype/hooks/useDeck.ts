import { Socket } from 'socket.io-client';

import { usePartOperations } from '@/features/prototype/hooks/usePartOperations';
import { Part } from '@/types';

/**
 * 山札の状態を管理するフック
 * @param part - パーツ
 * @param socket - ソケット
 * @returns 山札の状態
 */
export const useDeck = (part: Part, socket: Socket) => {
  const { shuffleDeck } = usePartOperations(part.prototypeVersionId, socket);

  /**
   * 山札をシャッフルする
   */
  const handleShuffleDeck = () => {
    // 山札でない場合
    if (part.type !== 'deck') return;

    shuffleDeck(part.id);
  };

  return {
    shuffleDeck: handleShuffleDeck,
  };
};
