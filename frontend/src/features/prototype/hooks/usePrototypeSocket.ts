/**
 * @page ソケット通信の設定を行うカスタムフック
 */
import { useCallback, useEffect, useState } from 'react';

import { Part, PartProperty } from '@/api/types';
import {
  COMMON_SOCKET_EVENT,
  PROTOTYPE_SOCKET_EVENT,
  UNEXPECTED_DISCONNECT_REASONS,
} from '@/features/prototype/constants/socket';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { useSocket } from '@/features/prototype/contexts/SocketContext';
import {
  ConnectedUser,
  CursorInfo,
  PartsMap,
  PropertiesMap,
} from '@/features/prototype/types';

interface UsePrototypeSocketProps {
  /** プロトタイプID */
  prototypeId: string;
  /** ユーザーID */
  userId: string;
}

interface UsePrototypeSocketReturn {
  /** パーツのMap */
  partsMap: PartsMap;
  /** パーツプロパティのMap */
  propertiesMap: PropertiesMap;
  /** カーソル情報 */
  cursors: Record<string, CursorInfo>;
  /** 接続中ユーザーリスト */
  connectedUsers: ConnectedUser[];
}

/*
 * 接続中ユーザーリストのペイロード型
 */
interface ConnectedUsersPayload {
  users: ConnectedUser[];
}
/**
 * プロトタイプ用ソケットを初期化し、イベントを購読して状態を同期するカスタムフック
 * @param prototypeId プロトタイプID（string）
 * @param userId ユーザーID（string）
 * @returns パーツ・プロパティ・カーソル・接続中ユーザーの状態を返す
 *   - partsMap: パーツのMap
 *   - propertiesMap: パーツプロパティのMap
 *   - cursors: ユーザーIDをキーにしたカーソル情報
 *   - connectedUsers: 接続中ユーザー配列
 */
export const usePrototypeSocket = ({
  prototypeId,
  userId,
}: UsePrototypeSocketProps): UsePrototypeSocketReturn => {
  const { socket } = useSocket();
  const { selectMultipleParts } = useSelectedParts();

  // パーツをMap管理（O(1)アクセス）
  const [partsMap, setPartsMap] = useState<PartsMap>(new Map());
  // パーツのプロパティをMap管理（O(1)アクセス）
  const [propertiesMap, setPropertiesMap] = useState<PropertiesMap>(new Map());
  // カーソル情報
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  // 接続中ユーザーリスト
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

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
    socket.on(COMMON_SOCKET_EVENT.CONNECT_ERROR, (error: unknown) => {
      console.error('Socket接続エラーが発生しました:', error);
      // 再接続を試行
      socket.connect();
    });

    // 切断時の処理
    socket.on(COMMON_SOCKET_EVENT.DISCONNECT, (reason: string) => {
      // 予期しない切断の場合は再接続を試行
      if (UNEXPECTED_DISCONNECT_REASONS.has(reason)) {
        console.error('Socket接続が予期せず切断されました:', { reason });
        socket.connect();
      }
    });

    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit(PROTOTYPE_SOCKET_EVENT.JOIN_PROTOTYPE, {
      prototypeId,
      userId,
    });

    // 初期データ受信（全データ）
    socket.on(PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS, ({ parts, properties }) => {
      const { newPartsMap, newPropertiesMap } = convertToMaps(
        parts,
        properties
      );
      setPartsMap(newPartsMap);
      setPropertiesMap(newPropertiesMap);
    });

    // パーツ追加
    socket.on(PROTOTYPE_SOCKET_EVENT.ADD_PART, ({ part, properties }) => {
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
    socket.on(
      PROTOTYPE_SOCKET_EVENT.ADD_PART_RESPONSE,
      ({ partId }: { partId: number }) => {
        selectMultipleParts([partId]);
      }
    );

    // パーツ更新
    socket.on(PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS, ({ parts, properties }) => {
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
    socket.on(PROTOTYPE_SOCKET_EVENT.DELETE_PART, ({ partId }) => {
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
    socket.on(
      PROTOTYPE_SOCKET_EVENT.UPDATE_CURSORS,
      ({ cursors }: { cursors: Record<string, CursorInfo> }) => {
        setCursors(cursors);
      }
    );

    // 接続中ユーザーリスト更新
    socket.on(
      PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS,
      (payload: ConnectedUsersPayload) => {
        setConnectedUsers(payload.users);
      }
    );

    return () => {
      // イベントリスナーを削除
      // JOIN_PROTOTYPEはemitリスナーを登録しないため、削除不要
      // 他のイベントはすべて削除
      const events = [
        COMMON_SOCKET_EVENT.CONNECT_ERROR,
        COMMON_SOCKET_EVENT.DISCONNECT,
        PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS,
        PROTOTYPE_SOCKET_EVENT.ADD_PART,
        PROTOTYPE_SOCKET_EVENT.ADD_PART_RESPONSE,
        PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
        PROTOTYPE_SOCKET_EVENT.DELETE_PART,
        PROTOTYPE_SOCKET_EVENT.UPDATE_CURSORS,
        PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS,
      ];
      events.forEach((event) => socket.off(event));
    };
  }, [prototypeId, userId, convertToMaps, selectMultipleParts, socket]);

  return {
    partsMap,
    propertiesMap,
    cursors,
    connectedUsers,
  };
};
