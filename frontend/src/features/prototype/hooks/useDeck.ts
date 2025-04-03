import { useReducer } from 'react';

import { Part } from '@/api/types';
import { usePrototype } from '@/features/prototype/contexts/PrototypeContext';
import { createPartReducer } from '@/features/prototype/reducers/partReducer';

/**
 * 山札の状態を管理するフック
 * @param part - パーツ
 * @returns 山札の状態
 */
export const useDeck = (part: Part) => {
  const { socket, prototypeVersionId } = usePrototype();

  const [, dispatch] = useReducer(
    createPartReducer(socket, prototypeVersionId),
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
