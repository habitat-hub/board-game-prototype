/**
 * @page パーツのソケット通信を行うカスタムフック
 */
import { useCallback } from 'react';

import { Part, PartProperty } from '@/api/types';
import { useSocket } from '@/features/prototype/contexts/SocketContext';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { PartPropertyUpdate } from '@/features/prototype/types';

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
          'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'
        >;
        properties: PartPropertiesWithoutMetadata[];
      };
    }
  // カードの裏返し
  | {
      type: 'FLIP_CARD';
      payload: { cardId: number; nextFrontSide: 'front' | 'back' };
    }
  // パーツの更新
  | {
      type: 'UPDATE_PART';
      payload: {
        partId: number;
        updatePart?: Partial<Part>;
        updateProperties?: Partial<PartPropertyUpdate>[];
        frontSide?: 'front' | 'back';
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
  | { type: 'SHUFFLE_DECK'; payload: { deckId: number } };

export const usePartReducer = () => {
  const { socket } = useSocket();
  const { measureOperation } = usePerformanceTracker();

  const dispatch = useCallback(
    (action: PartAction) => {
      measureOperation('Part Operation', () => {
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
              nextFrontSide: action.payload.nextFrontSide,
            });

            break;
          // パーツの更新
          case 'UPDATE_PART':
            socket.emit('UPDATE_PART', {
              partId: action.payload.partId,
              updatePart: action.payload.updatePart,
              updateProperties: action.payload.updateProperties,
            });

            if (action.payload.updatePart && action.payload.frontSide) {
              socket.emit('FLIP_CARD', {
                cardId: action.payload.partId,
                nextFrontSide: action.payload.frontSide,
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
        }
      });
    },
    [socket, measureOperation]
  );

  return { dispatch };
};
