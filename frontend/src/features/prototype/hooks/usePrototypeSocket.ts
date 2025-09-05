/**
 * @page ソケット通信の設定を行うカスタムフック
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Part, PartProperty } from '@/api/types';
import {
  COMMON_SOCKET_EVENT,
  PROTOTYPE_SOCKET_EVENT,
} from '@/features/prototype/constants/socket';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { useSocket } from '@/features/prototype/contexts/SocketContext';
import {
  ConnectedUser,
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
  /** 接続中ユーザーリスト */
  connectedUsers: ConnectedUser[];
  /** 他ユーザーのパーツ選択 */
  selectedUsersByPart: Record<number, ConnectedUser[]>;
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
 * @returns パーツ・プロパティ・接続中ユーザーの状態を返す
 *   - partsMap: パーツのMap
 *   - propertiesMap: パーツプロパティのMap
 *   - connectedUsers: 接続中ユーザー配列
 */
export const usePrototypeSocket = ({
  prototypeId,
  userId,
}: UsePrototypeSocketProps): UsePrototypeSocketReturn => {
  const { socket } = useSocket();
  const { selectMultipleParts, selectedPartIds } = useSelectedParts();

  const SELECTION_TTL_MS = 1500;
  const SELECTION_BROADCAST_INTERVAL_MS = 1000;

  // パーツをMap管理（O(1)アクセス）
  const [partsMap, setPartsMap] = useState<PartsMap>(new Map());
  // パーツのプロパティをMap管理（O(1)アクセス）
  const [propertiesMap, setPropertiesMap] = useState<PropertiesMap>(new Map());
  // 接続中ユーザーリスト
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [otherSelections, setOtherSelections] = useState<
    Record<
      string,
      { username: string; selectedPartIds: number[]; timestamp: number }
    >
  >({});

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
    socket.on(COMMON_SOCKET_EVENT.DISCONNECT, () => {
      alert('接続が切断されました。ページを再読み込みしてください。');
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

    // パーツ一括削除
    socket.on(
      PROTOTYPE_SOCKET_EVENT.DELETE_PARTS,
      ({ partIds }: { partIds: number[] }) => {
        setPartsMap((prevPartsMap) => {
          const newPartsMap = new Map(prevPartsMap);
          partIds.forEach((partId) => newPartsMap.delete(partId));
          return newPartsMap;
        });

        setPropertiesMap((prevPropertiesMap) => {
          const newPropertiesMap = new Map(prevPropertiesMap);
          partIds.forEach((partId) => newPropertiesMap.delete(partId));
          return newPropertiesMap;
        });
      }
    );

    // 接続中ユーザーリスト更新
    socket.on(
      PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS,
      (payload: ConnectedUsersPayload) => {
        setConnectedUsers(payload.users);
      }
    );

    type SelectedPartsIncoming = {
      userId?: string;
      username?: string;
      selectedPartIds?: unknown;
    };
    const onSelectedParts = ({
      userId: fromUserId,
      username,
      selectedPartIds,
    }: SelectedPartsIncoming) => {
      if (!fromUserId) return;
      // 自分自身のイベントは無視（サーバーの挙動変更に備えて冪等に）
      if (fromUserId === userId) return;
      const ids = Array.isArray(selectedPartIds)
        ? (selectedPartIds.filter((v) => typeof v === 'number') as number[])
        : [];
      setOtherSelections((prev) => {
        const next = { ...prev };
        if (ids.length === 0) {
          delete next[fromUserId];
        } else {
          next[fromUserId] = {
            username: username ?? '',
            selectedPartIds: ids,
            timestamp: Date.now(),
          };
        }
        return next;
      });
    };
    socket.on(PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS, onSelectedParts);

    return () => {
      // イベントリスナーを削除
      // JOIN_PROTOTYPEはemitリスナーを登録しないため、削除不要
      // 他のイベントはすべて削除
      const events = [
        COMMON_SOCKET_EVENT.CONNECT_ERROR,
        COMMON_SOCKET_EVENT.DISCONNECTING,
        COMMON_SOCKET_EVENT.DISCONNECT,
        PROTOTYPE_SOCKET_EVENT.INITIAL_PARTS,
        PROTOTYPE_SOCKET_EVENT.ADD_PART,
        PROTOTYPE_SOCKET_EVENT.ADD_PART_RESPONSE,
        PROTOTYPE_SOCKET_EVENT.UPDATE_PARTS,
        PROTOTYPE_SOCKET_EVENT.DELETE_PARTS,
        PROTOTYPE_SOCKET_EVENT.CONNECTED_USERS,
        PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS,
      ];
      events.forEach((event) => socket.off(event));
    };
  }, [prototypeId, userId, convertToMaps, selectMultipleParts, socket]);

  // タブを再度アクティブにした際にソケットを再接続
  useEffect(() => {
    if (!socket) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.emit(PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS, { selectedPartIds });
  }, [selectedPartIds, socket]);

  useEffect(() => {
    if (!socket) return;
    if (selectedPartIds.length === 0) return;
    const timer = setInterval(() => {
      socket.emit(PROTOTYPE_SOCKET_EVENT.SELECTED_PARTS, { selectedPartIds });
    }, SELECTION_BROADCAST_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [socket, selectedPartIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOtherSelections((prev) => {
        const next = { ...prev };
        Object.entries(prev).forEach(([uid, data]) => {
          if (now - data.timestamp >= SELECTION_TTL_MS) {
            delete next[uid];
          }
        });
        return next;
      });
    }, SELECTION_TTL_MS);
    return () => clearInterval(interval);
  }, []);

  const selectedUsersByPart = useMemo(() => {
    const map: Record<number, ConnectedUser[]> = {};
    Object.entries(otherSelections).forEach(([uid, { username, selectedPartIds }]) => {
      selectedPartIds.forEach((id) => {
        if (!map[id]) map[id] = [];
        map[id].push({ userId: uid, username });
      });
    });
    return map;
  }, [otherSelections]);

  return {
    partsMap,
    propertiesMap,
    connectedUsers,
    selectedUsersByPart,
  };
};
