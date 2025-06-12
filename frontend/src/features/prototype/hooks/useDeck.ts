import { Part } from '@/api/types';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';

/**
 * 山札の状態を管理するフック
 * @param part - パーツ
 * @returns 山札の状態
 */
export const useDeck = (part: Part) => {
  const { dispatch } = usePartReducer();
  const { measureOperation } = usePerformanceTracker();

  /**
   * 山札をシャッフルする
   */
  const handleShuffleDeck = () => {
    // 山札でない場合
    if (part.type !== 'deck') return;

    measureOperation('Deck Shuffle', () => {
      dispatch({ type: 'SHUFFLE_DECK', payload: { deckId: part.id } });
    });
  };

  return {
    shuffleDeck: handleShuffleDeck,
  };
};
