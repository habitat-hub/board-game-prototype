'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

import Canvas from '@/features/prototype/components/organisms/Canvas';
import axiosInstance from '@/utils/axiosInstance';

import { AllPart, Player, Prototype, PrototypeVersion } from '../../type';
import { PROTOTYPE_TYPE } from '../../const';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const PrototypeEdit: React.FC = () => {
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
  const [parts, setParts] = useState<AllPart[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // socket通信の設定
  useEffect(() => {
    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', { prototypeVersionId: versionId });

    socket.on('UPDATE_PARTS', (parts) => {
      setParts(parts);
    });

    socket.on('UPDATE_PLAYERS', (players) => {
      setPlayers(players);
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
        if (prototype.type !== PROTOTYPE_TYPE.EDIT) {
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
      prototypeName={`${prototype.name} - version${versionNumber}`}
      parts={parts}
      players={players}
      prototypeVersionId={versionId}
      socket={socket}
      groupId={prototype.groupId}
    />
  );
};

export default PrototypeEdit;
