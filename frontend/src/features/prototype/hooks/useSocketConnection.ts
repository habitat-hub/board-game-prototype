/**
 * @page ソケット通信の設定を行うカスタムフック
 */
import { useCallback, useEffect, useState } from 'react';

import { Part, PartProperty } from '@/api/types';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import {
  CursorInfo,
  PartsMap,
  PropertiesMap,
} from '@/features/prototype/types';

import {
  SOCKET_EVENT,
  UNEXPECTED_DISCONNECT_REASONS,
} from '../constants/socket';
import { useSocket } from '../contexts/SocketContext';

interface UseSocketConnectionProps {
  /** プロトタイプID */
  prototypeId: string;
  /** ユーザーID */
  userId: string;
}

interface UseSocketConnectionReturn {
  /** パーツのMap */
  partsMap: PartsMap;
  /** パーツプロパティのMap */
  propertiesMap: PropertiesMap;
  /** カーソル情報 */
  cursors: Record<string, CursorInfo>;
}

export const useSocketConnection = ({
  prototypeId,
  userId,
}: UseSocketConnectionProps): UseSocketConnectionReturn => {
  const { socket } = useSocket();
  const { selectMultipleParts } = useSelectedParts();

  // パーツをMap管理（O(1)アクセス）
  const [partsMap, setPartsMap] = useState<PartsMap>(new Map());
  // パーツのプロパティをMap管理（O(1)アクセス）
  const [propertiesMap, setPropertiesMap] = useState<PropertiesMap>(new Map());
  // カーソル
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});

  // パーツとプロパティをMapに変換する関数
  const convertToMaps = useCallback(
    (parts: Part[], properties: PartProperty[]) => {
      const newPartsMap = new Map<number, Part>();
      const newPropertiesMap = new Map<number, PartProperty[]>();

      // パーツをMapに変換
      parts.forEach((part) => {
        newPartsMap.set(part.id, part);
      });

      // プロパティをMapに変換
      properties.forEach((property) => {
        const existing = newPropertiesMap.get(property.partId) || [];
        newPropertiesMap.set(property.partId, [...existing, property]);
      });

      return { newPartsMap, newPropertiesMap };
    },
    []
  );

  // socket通信の設定
  useEffect(() => {
    if (!socket) return;

    // エラーハンドリング
    socket.on(SOCKET_EVENT.CONNECT_ERROR, (error) => {
      console.error('Socket接続エラーが発生しました:', error);
      // 再接続を試行
      socket.connect();
    });

    // 切断時の処理
    socket.on(SOCKET_EVENT.DISCONNECT, (reason: string) => {
      // 予期しない切断の場合は再接続を試行
      if (UNEXPECTED_DISCONNECT_REASONS.has(reason)) {
        console.error('Socket接続が予期せず切断されました:', { reason });
        socket.connect();
      }
    });

    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit(SOCKET_EVENT.JOIN_PROTOTYPE, {
      prototypeId,
      userId,
    });

    // 初期データ受信（全データ）
    socket.on(SOCKET_EVENT.INITIAL_PARTS, ({ parts, properties }) => {
      const { newPartsMap, newPropertiesMap } = convertToMaps(
        parts,
        properties
      );
      setPartsMap(newPartsMap);
      setPropertiesMap(newPropertiesMap);
    });

    // パーツ追加
    socket.on(SOCKET_EVENT.ADD_PART, ({ part, properties }) => {
      setPartsMap((prevPartsMap) => {
        const newPartsMap = new Map(prevPartsMap);
        newPartsMap.set(part.id, part);
        return newPartsMap;
      });

      setPropertiesMap((prevPropertiesMap) => {
        const newPropertiesMap = new Map(prevPropertiesMap);
        newPropertiesMap.set(part.id, properties);
        return newPropertiesMap;
      });
    });

    // パーツ追加レスポンス（自分の追加したパーツを選択状態にする）
    socket.on(SOCKET_EVENT.ADD_PART_RESPONSE, ({ partId }) => {
      selectMultipleParts([partId]);
    });

    // パーツ更新
    socket.on(SOCKET_EVENT.UPDATE_PARTS, ({ parts, properties }) => {
      setPartsMap((prevPartsMap) => {
        const newPartsMap = new Map(prevPartsMap);
        parts.forEach((part: Part) => {
          newPartsMap.set(part.id, part);
        });
        return newPartsMap;
      });

      setPropertiesMap((prevPropertiesMap) => {
        const newPropertiesMap = new Map(prevPropertiesMap);
        properties.forEach((property: PartProperty) => {
          const existing = newPropertiesMap.get(property.partId) || [];
          newPropertiesMap.set(property.partId, [
            ...existing.filter((p) => p.side !== property.side),
            property,
          ]);
        });
        return newPropertiesMap;
      });
    });

    // パーツ削除
    socket.on(SOCKET_EVENT.DELETE_PART, ({ partId }) => {
      setPartsMap((prevPartsMap) => {
        const newPartsMap = new Map(prevPartsMap);
        newPartsMap.delete(partId);
        return newPartsMap;
      });

      setPropertiesMap((prevPropertiesMap) => {
        const newPropertiesMap = new Map(prevPropertiesMap);
        newPropertiesMap.delete(partId);
        return newPropertiesMap;
      });
    });

    // カーソル更新
    socket.on(SOCKET_EVENT.UPDATE_CURSORS, ({ cursors }) => {
      setCursors(cursors);
    });

    return () => {
      // イベントリスナーを削除
      // JOIN_PROTOTYPEはemitリスナーを登録しないため、削除不要
      // 他のイベントはすべて削除
      const events = [
        SOCKET_EVENT.CONNECT_ERROR,
        SOCKET_EVENT.DISCONNECT,
        SOCKET_EVENT.INITIAL_PARTS,
        SOCKET_EVENT.ADD_PART,
        SOCKET_EVENT.ADD_PART_RESPONSE,
        SOCKET_EVENT.UPDATE_PARTS,
        SOCKET_EVENT.DELETE_PART,
        SOCKET_EVENT.UPDATE_CURSORS,
      ];
      events.forEach((event) => socket.off(event));
    };
  }, [prototypeId, userId, convertToMaps, selectMultipleParts, socket]);

  return {
    partsMap,
    propertiesMap,
    cursors,
  };
};
