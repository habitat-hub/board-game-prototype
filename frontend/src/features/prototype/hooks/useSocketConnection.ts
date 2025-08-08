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
    socket.on('connect_error', (error) => {
      console.error('Socket接続エラーが発生しました:', error);
      // 再接続を試行
      socket.connect();
    });

    // 切断時の処理
    socket.on('disconnect', (reason) => {
      console.error('Socket接続が切断されました:', { reason });
      // 予期しない切断の場合は再接続を試行
      if (reason === 'io server disconnect' || reason === 'transport error') {
        socket.connect();
      }
    });

    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', {
      prototypeId,
      userId,
    });

    // 初期データ受信（全データ）
    socket.on('INITIAL_PARTS', ({ parts, properties }) => {
      const { newPartsMap, newPropertiesMap } = convertToMaps(
        parts,
        properties
      );
      setPartsMap(newPartsMap);
      setPropertiesMap(newPropertiesMap);
    });

    // パーツ追加
    socket.on('ADD_PART', ({ part, properties }) => {
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
    socket.on('ADD_PART_RESPONSE', ({ partId }) => {
      selectMultipleParts([partId]);
    });

    // パーツ更新
    socket.on('UPDATE_PARTS', ({ parts, properties }) => {
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
    socket.on('DELETE_PART', ({ partId }) => {
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
    socket.on('UPDATE_CURSORS', ({ cursors }) => {
      setCursors(cursors);
    });

    return () => {
      // イベントリスナーを削除
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('INITIAL_PARTS');
      socket.off('ADD_PART');
      socket.off('ADD_PART_RESPONSE');
      socket.off('UPDATE_PARTS');
      socket.off('DELETE_PART');
      socket.off('UPDATE_CURSORS');
    };
  }, [prototypeId, userId, convertToMaps, selectMultipleParts, socket]);

  return {
    partsMap,
    propertiesMap,
    cursors,
  };
};
