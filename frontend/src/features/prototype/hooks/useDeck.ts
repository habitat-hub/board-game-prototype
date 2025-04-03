import { useReducer } from 'react';
import { Socket } from 'socket.io-client';

import { Part } from '@/api/types';
import { createPartReducer } from '@/features/prototype/reducers/partReducer';

/**
 * 山札の状態を管理するフック
 * @param part - パーツ
 * @param socket - ソケット
 * @returns 山札の状態
 */
export const useDeck = (part: Part, socket: Socket) => {
  const [, dispatch] = useReducer(
    createPartReducer(socket, part.prototypeVersionId),
    undefined
  );

  /**
   * 山札をシャッフルする
   */
  const handleShuffleDeck = () => {
    // 山札でない場合
    if (part.type !== 'deck') return;

    dispatch({ type: 'SHUFFLE_DECK', payload: { deckId: part.id } });
  };

  return {
    shuffleDeck: handleShuffleDeck,
  };
};
