'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import {
  Part,
  PartProperty,
  Player,
  Prototype,
  PrototypeGroup,
} from '@/api/types';
import Canvas from '@/features/prototype/components/organisms/Canvas';
import { PrototypeIdProvider } from '@/features/prototype/contexts/PrototypeIdContext';
import { SocketProvider } from '@/features/prototype/contexts/SocketContext';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { useUser } from '@/hooks/useUser';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const PrototypePlayOld: React.FC = () => {
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
  // プレイヤー
  const [players, setPlayers] = useState<Player[]>([]);
  // カーソル
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});

  // socket通信
  useEffect(() => {
    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', {
      prototypeId,
      userId: user?.id || '',
    });

    // 更新パーツの受信
    socket.on('UPDATE_PARTS', ({ parts, properties }) => {
      setParts(parts);
      setProperties(properties);
    });

    // 更新プレイヤーの受信
    socket.on('UPDATE_PLAYERS', (players: Player[]) => {
      setPlayers(players.sort((a, b) => a.id - b.id));
    });

    // 更新カーソルの受信
    socket.on('UPDATE_CURSORS', ({ cursors }) => {
      setCursors(cursors);
    });

    return () => {
      socket.off('UPDATE_PARTS');
      socket.off('UPDATE_PLAYERS');
      socket.off('UPDATE_CURSORS');
    };
  }, [prototypeId, user?.id]);

  // プロタイプの取得
  useEffect(() => {
    getPrototypeGroup(prototypeId)
      .then((response) => {
        const { prototypeGroup, prototypes } = response;

        setPrototype({ ...prototypeGroup, prototypes });
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [getPrototypeGroup, prototypeId, router]);

  // プロトタイプバージョン番号
  const versionNumber = useMemo(() => {
    return prototype?.prototypes.find(
      (prototype) => prototype.id === prototypeId
    )?.versionNumber;
  }, [prototype, prototypeId]);

  // プロトタイプが存在しない場合
  if (!prototype) return null;

  return (
    <SocketProvider socket={socket}>
      <PrototypeIdProvider prototypeId={prototypeId}>
        <Canvas
          prototypeName={
            prototype.prototypes.find(
              (prototype) => prototype.id === prototypeId
            )?.name || ''
          }
          parts={parts}
          properties={properties}
          players={players}
          cursors={cursors}
          prototypeVersionNumber={versionNumber}
          groupId={groupId}
          prototypeType="VERSION"
        />
      </PrototypeIdProvider>
    </SocketProvider>
  );
};

export default PrototypePlayOld;
