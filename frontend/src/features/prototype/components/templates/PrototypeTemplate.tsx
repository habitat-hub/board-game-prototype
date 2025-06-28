'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import { Part, PartProperty, Prototype, PrototypeGroup } from '@/api/types';
import GameBoard from '@/features/prototype/components/organisms/GameBoard';
import { PrototypeIdProvider } from '@/features/prototype/contexts/PrototypeIdContext';
import { SocketProvider } from '@/features/prototype/contexts/SocketContext';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';
import { useUser } from '@/hooks/useUser';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

export default function PrototypeTemplate() {
  const router = useRouter();
  const { getPrototypeGroup } = usePrototypeGroup();
  const { user } = useUser();

  // プロトタイプID, バージョンID
  const { groupId, prototypeId } = useParams<{
    groupId: string;
    prototypeId: string;
  }>();

  // プロトタイプ
  const [prototype, setPrototype] = useState<
    | (PrototypeGroup & {
        prototypes: Prototype[];
      })
    | null
  >(null);
  // パーツ
  const [parts, setParts] = useState<Part[]>([]);
  // パーツのプロパティ
  const [properties, setProperties] = useState<PartProperty[]>([]);
  // カーソル
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});

  // socket通信の設定
  useEffect(() => {
    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', {
      prototypeId,
      userId: user?.id || '',
    });

    // 更新されたパーツを受信
    socket.on('UPDATE_PARTS', ({ parts, properties }) => {
      setParts(parts);
      setProperties(properties);
    });

    // 更新されたカーソルを受信
    socket.on('UPDATE_CURSORS', ({ cursors }) => {
      setCursors(cursors);
    });

    return () => {
      socket.off('UPDATE_PARTS');
      socket.off('UPDATE_CURSORS');
    };
  }, [prototypeId, user?.id]);

  // プロタイプの取得
  useEffect(() => {
    getPrototypeGroup(groupId)
      .then((response) => {
        const { prototypeGroup, prototypes } = response;

        setPrototype({ ...prototypeGroup, prototypes });
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [getPrototypeGroup, groupId, router]);

  // バージョン番号
  const versionNumber = useMemo(() => {
    return prototype?.prototypes.find(
      (prototype) => prototype.id === prototypeId
    )?.versionNumber;
  }, [prototype, prototypeId]);

  if (!prototype) return null;

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
    <SocketProvider socket={socket}>
      <PrototypeIdProvider prototypeId={prototypeId}>
        <GameBoard
          prototypeName={prototypeName}
          parts={parts}
          properties={properties}
          cursors={cursors}
          prototypeVersionNumber={versionNumber}
          groupId={groupId}
          gameBoardMode={mode}
        />
      </PrototypeIdProvider>
    </SocketProvider>
  );
}
