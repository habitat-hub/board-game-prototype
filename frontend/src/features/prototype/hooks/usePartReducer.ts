import { useCallback } from 'react';

import { Part, PartProperty } from '@/api/types';
import { usePrototypeVersionId } from '@/features/prototype/hooks/usePrototypeVersionId';
import { useSocket } from '@/features/prototype/hooks/useSocket';

// パーツのプロパティの型定義(metadataを除いた型)
type PartPropertiesWithoutMetadata = Omit<
  PartProperty,
  'partId' | 'createdAt' | 'updatedAt'
>;

// アクションの型定義
export type PartAction =
  // パーツの追加
  | {
      type: 'ADD_PART';
      payload: {
        part: Omit<
          Part,
          'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
        >;
        properties: PartPropertiesWithoutMetadata[];
      };
    }
  // カードの裏返し
  | { type: 'FLIP_CARD'; payload: { cardId: number; isNextFlipped: boolean } }
  // パーツの更新
  | {
      type: 'UPDATE_PART';
      payload: {
        partId: number;
        updatePart?: Partial<Part>;
        updateProperties?: Partial<PartProperty>[];
        isFlipped?: boolean;
      };
    }
  // パーツの削除
  | { type: 'DELETE_PART'; payload: { partId: number } }
  // パーツの順番の変更
  | {
      type: 'CHANGE_ORDER';
      payload: {
        partId: number;
        type: 'front' | 'back' | 'backmost' | 'frontmost';
      };
    }
  // デッキのシャッフル
  | { type: 'SHUFFLE_DECK'; payload: { deckId: number } }
  // プレイヤーのユーザーの更新
  | {
      type: 'UPDATE_PLAYER_USER';
      payload: { playerId: number; userId: string | null };
    };

export const usePartReducer = () => {
  const { socket } = useSocket();
  const { prototypeVersionId } = usePrototypeVersionId();

  const dispatch = useCallback(
    (action: PartAction) => {
      switch (action.type) {
        // パーツの追加
        case 'ADD_PART':
          socket.emit('ADD_PART', {
            part: action.payload.part,
            properties: action.payload.properties,
          });
          break;
        // カードの裏返し
        case 'FLIP_CARD':
          socket.emit('FLIP_CARD', {
            cardId: action.payload.cardId,
            isNextFlipped: action.payload.isNextFlipped,
          });

          break;
        // パーツの更新
        case 'UPDATE_PART':
          socket.emit('UPDATE_PART', {
            partId: action.payload.partId,
            updatePart: action.payload.updatePart,
            updateProperties: action.payload.updateProperties,
          });

          if (
            action.payload.updatePart &&
            'isReversible' in action.payload.updatePart &&
            action.payload.isFlipped
          ) {
            socket.emit('FLIP_CARD', {
              cardId: action.payload.partId,
              isNextFlipped: !action.payload.isFlipped,
            });
          }
          break;
        // パーツの削除
        case 'DELETE_PART':
          socket.emit('DELETE_PART', {
            partId: action.payload.partId,
          });
          break;
        // パーツの順番の変更
        case 'CHANGE_ORDER':
          socket.emit('CHANGE_ORDER', {
            partId: action.payload.partId,
            type: action.payload.type,
          });
          break;
        // デッキのシャッフル
        case 'SHUFFLE_DECK':
          socket.emit('SHUFFLE_DECK', {
            deckId: action.payload.deckId,
          });
          break;
        // プレイヤーのユーザーの更新
        case 'UPDATE_PLAYER_USER':
          socket.emit('UPDATE_PLAYER_USER', {
            playerId: action.payload.playerId,
            userId: action.payload.userId,
          });
          break;
      }
    },
    [socket, prototypeVersionId]
  );

  return { dispatch };
};
