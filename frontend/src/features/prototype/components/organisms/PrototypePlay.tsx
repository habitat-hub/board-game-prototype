'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import Canvas from '@/features/prototype/components/organisms/Canvas';
import { PROTOTYPE_TYPE } from '@/features/prototype/const';
import { Part, Player, Prototype, PrototypeVersion } from '@/types/models';
import axiosInstance from '@/utils/axiosInstance';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const PrototypePlay: React.FC = () => {
  const router = useRouter();
  const { prototypeId, versionId } = useParams<{
    prototypeId: string;
    versionId: string;
  }>();
  const [prototype, setPrototype] = useState<
    | (Prototype & {
        versions: PrototypeVersion[];
      })
    | null
  >(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // socket通信の設定
  useEffect(() => {
    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', { prototypeVersionId: versionId });

    socket.on('UPDATE_PARTS', (parts) => {
      setParts(parts);
    });

    socket.on('UPDATE_PLAYERS', (players: Player[]) => {
      setPlayers(players.sort((a, b) => a.id - b.id));
    });

    return () => {
      socket.off('UPDATE_PARTS');
      socket.off('UPDATE_PLAYERS');
    };
  }, [versionId]);

  // プロタイプの取得
  useEffect(() => {
    axiosInstance
      .get(`/api/prototypes/${prototypeId}/versions`)
      .then((response) => {
        const { prototype, versions } = response.data;
        if (prototype.type !== PROTOTYPE_TYPE.PREVIEW) {
          router.replace(`/prototypes/groups/${prototype.groupId}`);
          return;
        }

        setPrototype({ ...prototype, versions });
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [prototypeId, router]);

  const versionNumber = useMemo(() => {
    return prototype?.versions.find((version) => version.id === versionId)
      ?.versionNumber;
  }, [prototype, versionId]);

  if (!prototype) return null;

  return (
    <Canvas
      prototypeName={prototype.name}
      parts={parts}
      players={players}
      prototypeVersionId={versionId}
      prototypeVersionNumber={versionNumber}
      socket={socket}
      groupId={prototype.groupId}
      prototypeType={PROTOTYPE_TYPE.PREVIEW}
    />
  );
};

export default PrototypePlay;
