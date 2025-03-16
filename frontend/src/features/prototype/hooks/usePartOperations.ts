import { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Part, PartProperty } from '@/types/models';


type PartPropertiesWithoutMetadata = Omit<PartProperty, 'partId' | 'createdAt' | 'updatedAt'>;

type AddPartPropertiesForServer = {
  front: PartPropertiesWithoutMetadata;
  back?: PartPropertiesWithoutMetadata;
}

type UpdatePartPropertiesForServer = {
  front?: Partial<PartProperty>;
  back?: Partial<PartProperty>;
}

export const usePartOperations = (
  prototypeVersionId: string,
  socket: Socket
) => {
  /**
   * パーツの追加
   * @param newPart - 追加するパーツ
   * @param newProperties - パーツのプロパティ
   */
  const addPart = useCallback(
    (
      part: Omit<Part, 'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'>,
      properties: PartPropertiesWithoutMetadata[]
    ) => {
      // プロパティ配列をサーバー用のオブジェクト形式に変換
      const convertedProperties: AddPartPropertiesForServer = {
        front: properties.find(p => p.side === 'front') || properties[0],
        back: properties.find(p => p.side === 'back'),
      };

      socket.emit('ADD_PART', { prototypeVersionId, part, properties: convertedProperties });
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
   * @param updateProperties - 更新するプロパティ
   * @param isFlipped - 現在、裏向きか
   */
  const updatePart = useCallback(
    (
      partId: number,
      updatePart?: Partial<Part>,
      updateProperties?: Partial<PartProperty>[],
      isFlipped?: boolean
    ) => {
      // プロパティ配列をサーバー用のオブジェクト形式に変換
      const convertedProperties: UpdatePartPropertiesForServer = 
      {
        front: updateProperties?.find(p => p?.side === 'front'),
        back: updateProperties?.find(p => p?.side === 'back'),
      };
      socket.emit('UPDATE_PART', {
        prototypeVersionId,
        partId,
        updatePart,
        updateProperties: convertedProperties,
      });

      if (updatePart && ('isReversible' in updatePart) && isFlipped) {
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

  const shuffleDeck = useCallback(
    (deckId: number) => {
      socket.emit('SHUFFLE_DECK', { prototypeVersionId, deckId });
    },
    [prototypeVersionId, socket]
  );

  /**
   * プレイヤーの割り当て
   * @param playerId - プレイヤーID
   * @param userId - ユーザーID
   */
  const assignPlayer = (playerId: number, userId: string | null) => {
    socket.emit('UPDATE_PLAYER_USER', {
      prototypeVersionId,
      playerId,
      userId,
    });
  };

  return {
    addPart,
    reverseCard,
    updatePart,
    deletePart,
    changeOrder,
    shuffleDeck,
    assignPlayer,
  };
};
