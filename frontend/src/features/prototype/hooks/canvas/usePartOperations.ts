import { useCallback } from 'react';
import { Socket } from 'socket.io-client';

import { Part } from '@/types/models';

export const usePartOperations = (
  prototypeVersionId: string,
  socket: Socket
) => {
  /**
   * パーツの追加
   * @param part - 追加するパーツ
   */
  const addPart = useCallback(
    (
      part: Omit<
        Part,
        'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
      >
    ) => {
      socket.emit('ADD_PART', { prototypeVersionId, part });
    },
    [prototypeVersionId, socket]
  );

  /**
   * カードの反転
   * @param cardId - カードID
   * @param isNextFlipped - 次に裏返しにするかどうか
   */
  const reverseCard = useCallback(
    (cardId: number, isNextFlipped: boolean) => {
      socket.emit('FLIP_CARD', {
        prototypeVersionId,
        cardId,
        isNextFlipped,
      });
    },
    [prototypeVersionId, socket]
  );

  /**
   * パーツの更新
   * @param partId - 更新するパーツID
   * @param updatePart - 更新するパーツ
   * @param isFlipped - 現在、裏向きか
   */
  const updatePart = useCallback(
    (partId: number, updatePart: Partial<Part>, isFlipped?: boolean) => {
      socket.emit('UPDATE_PART', { prototypeVersionId, partId, updatePart });

      if ('isReversible' in updatePart && isFlipped) {
        reverseCard(partId, false);
      }
    },
    [prototypeVersionId, reverseCard, socket]
  );

  /**
   * パーツの削除
   * @param partId - 削除するパーツID
   */
  const deletePart = useCallback(
    (partId: number) => {
      socket.emit('DELETE_PART', { prototypeVersionId, partId });
    },
    [prototypeVersionId, socket]
  );

  /**
   * パーツの順番を変更
   * @param partId - パーツID
   * @param type - 変更方向
   */
  const changeOrder = useCallback(
    (partId: number, type: string) => {
      socket.emit('CHANGE_ORDER', { prototypeVersionId, partId, type });
    },
    [prototypeVersionId, socket]
  );

  return {
    addPart,
    reverseCard,
    updatePart,
    deletePart,
    changeOrder,
  };
};
