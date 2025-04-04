import { Part } from '@/api/types';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';

/**
 * 山札の状態を管理するフック
 * @param part - パーツ
 * @returns 山札の状態
 */
export const useDeck = (part: Part) => {
  const { dispatch } = usePartReducer();

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
