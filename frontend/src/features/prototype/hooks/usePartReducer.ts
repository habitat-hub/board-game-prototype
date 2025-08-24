/**
 * @page パーツのソケット通信を行うカスタムフック
 */
import { useCallback } from 'react';

import { useSocket } from '@/features/prototype/contexts/SocketContext';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { PartDispatch } from '@/features/prototype/types/socket';

export type PartReducer = {
  dispatch: PartDispatch;
};

export const usePartReducer = (): PartReducer => {
  const { socket } = useSocket();
  const { measureOperation } = usePerformanceTracker();

  const dispatch = useCallback<PartDispatch>(
    (action) => {
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
          // パーツの一括削除
          case 'DELETE_PARTS':
            socket.emit('DELETE_PARTS', {
              partIds: action.payload.partIds,
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
