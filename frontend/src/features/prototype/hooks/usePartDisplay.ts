import { useMemo } from 'react';

import { Part, Player } from '@/api/types';
import { useUser } from '@/hooks/useUser';

/**
 * パーツの表示に関する処理を行うカスタムフック
 */
export const usePartDisplay = (parts: Part[], players: Player[]) => {
  const { user } = useUser();

  // パーツを表示順に並び替える
  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [parts]);

  // 他のプレイヤーのカード配列を取得
  const otherPlayerCards = useMemo(() => {
    if (!user) return [];

    // 自分以外が設定されているプレイヤー
    const playerIds = players
      .filter((player) => player.userId !== user.id)
      .map((player) => player.id);
    // 自分以外がオーナーの手札
    const otherPlayerHandIds = parts
      .filter(
        (part) =>
          part.type === 'hand' &&
          part.ownerId != null &&
          playerIds.includes(part.ownerId)
      )
      .map((part) => part.id);
    // 自分以外がオーナーのカード
    return parts
      .filter(
        (part) =>
          part.type === 'card' &&
          part.parentId != null &&
          otherPlayerHandIds.includes(part.parentId)
      )
      .map((part) => part.id);
  }, [parts, players, user]);

  // 特定のパーツIDが他のプレイヤーのカードかどうかをチェック
  const isOtherPlayerCard = (partId: number) => {
    return otherPlayerCards.includes(partId);
  };

  return {
    sortedParts,
    otherPlayerCards,
    isOtherPlayerCard,
  };
};
