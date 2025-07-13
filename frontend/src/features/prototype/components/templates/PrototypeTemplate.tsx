'use client';

import { useParams, useRouter } from 'next/navigation';
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';

import { useProject } from '@/api/hooks/useProject';
import { Part, PartProperty, Prototype, Project } from '@/api/types';
import GameBoard from '@/features/prototype/components/organisms/GameBoard';
import { PrototypeIdProvider } from '@/features/prototype/contexts/PrototypeIdContext';
import { SocketProvider } from '@/features/prototype/contexts/SocketContext';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';
import { useUser } from '@/hooks/useUser';

// パーツとプロパティのMap型定義
type PartsMap = Map<number, Part>;
type PropertiesMap = Map<number, PartProperty[]>;

export default function PrototypeTemplate() {
  const router = useRouter();
  const { getProject } = useProject();
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);

  // プロトタイプID, バージョンID
  const { projectId, prototypeId } = useParams<{
    projectId: string;
    prototypeId: string;
  }>();

  // プロトタイプ
  const [prototype, setPrototype] = useState<
    | (Project & {
        prototypes: Prototype[];
      })
    | null
  >(null);

  // パーツをMap管理（O(1)アクセス）
  const [partsMap, setPartsMap] = useState<PartsMap>(new Map());
  // パーツのプロパティをMap管理（O(1)アクセス）
  const [propertiesMap, setPropertiesMap] = useState<PropertiesMap>(new Map());
  // カーソル
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});

  // パーツMapを配列に変換するメモ化関数
  const partsArray = useMemo(() => {
    return Array.from(partsMap.values()).sort((a, b) => a.order - b.order);
  }, [partsMap]);

  // プロパティMapを配列に変換するメモ化関数
  const propertiesArray = useMemo(() => {
    return Array.from(propertiesMap.values()).flat();
  }, [propertiesMap]);

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
    // Socket接続を作成
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL);
    const socket = socketRef.current;

    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', {
      prototypeId,
      userId: user?.id || '',
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

    // 差分データ受信
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

    // 更新されたカーソルを受信
    socket.on('UPDATE_CURSORS', ({ cursors }) => {
      setCursors(cursors);
    });

    return () => {
      // イベントリスナーを削除
      socket.off('INITIAL_PARTS');
      socket.off('ADD_PART');
      socket.off('UPDATE_PARTS');
      socket.off('DELETE_PART');
      socket.off('UPDATE_CURSORS');

      // Socket接続を切断
      socket.disconnect();
      socketRef.current = null;
    };
  }, [prototypeId, user?.id, convertToMaps]);

  // プロタイプの取得
  useEffect(() => {
    getProject(projectId)
      .then((project) => {
        setPrototype(project);
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [getProject, projectId, router]);

  if (!prototype || !socketRef.current) return null;

  const selectedPrototype = prototype.prototypes.find(
    (p) => p.id === prototypeId
  );
  const prototypeName = selectedPrototype?.name || '';
  const getGameBoardMode = (
    prototypeType?: 'MASTER' | 'VERSION' | 'INSTANCE'
  ): GameBoardMode => {
    switch (prototypeType) {
      case 'MASTER':
        return GameBoardMode.CREATE;
      case 'VERSION':
        return GameBoardMode.PREVIEW;
      case 'INSTANCE':
        return GameBoardMode.PLAY;
      default:
        return GameBoardMode.PREVIEW;
    }
  };
  const mode = getGameBoardMode(selectedPrototype?.type);

  return (
    <SocketProvider socket={socketRef.current}>
      <PrototypeIdProvider prototypeId={prototypeId}>
        <GameBoard
          prototypeName={prototypeName}
          parts={partsArray}
          properties={propertiesArray}
          cursors={cursors}
          projectId={projectId}
          gameBoardMode={mode}
        />
      </PrototypeIdProvider>
    </SocketProvider>
  );
}
