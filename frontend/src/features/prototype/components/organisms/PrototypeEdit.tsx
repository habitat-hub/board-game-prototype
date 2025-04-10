'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import {
  Part,
  PartProperty,
  Player,
  Prototype,
  PrototypeVersion,
} from '@/api/types';
import Canvas from '@/features/prototype/components/organisms/Canvas';
import { PrototypeVersionIdProvider } from '@/features/prototype/contexts/PrototypeVersionIdContext';
import { SocketProvider } from '@/features/prototype/contexts/SocketContext';
import { ValidationType } from '@/types/validation';
const socket = io(process.env.NEXT_PUBLIC_API_URL);

const PrototypeEdit: React.FC = () => {
  const router = useRouter();
  const { getPrototypeVersions } = usePrototypes();

  // プロトタイプID, バージョンID
  const { prototypeId, versionId } = useParams<{
    prototypeId: string;
    versionId: string;
  }>();

  // プロトタイプ
  const [prototype, setPrototype] = useState<
    | (Prototype & {
        versions: PrototypeVersion[];
      })
    | null
  >(null);
  // パーツ
  const [parts, setParts] = useState<Part[]>([]);
  // パーツのプロパティ
  const [properties, setProperties] = useState<PartProperty[]>([]);
  // プレイヤー
  const [players, setPlayers] = useState<Player[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationType[]>(
    []
  );

  // socket通信の設定
  useEffect(() => {
    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', { prototypeVersionId: versionId });

    // 更新されたパーツを受信
    socket.on('UPDATE_PARTS', ({ parts, properties }) => {
      setParts(parts);
      setProperties(properties);
    });

    socket.on('UPDATE_PARTS_ERROR', ({ validationResults }) => {
      setValidationResults(validationResults);
    });

    // 更新されたプレイヤーを受信
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
    getPrototypeVersions(prototypeId)
      .then((response) => {
        const { prototype, versions } = response;

        // プロトタイプのタイプが編集版でない場合
        if (prototype.type !== 'EDIT') {
          router.replace(`/prototypes/groups/${prototype.groupId}`);
          return;
        }

        setPrototype({ ...prototype, versions });
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [getPrototypeVersions, prototypeId, router]);

  // バージョン番号
  const versionNumber = useMemo(() => {
    return prototype?.versions.find((version) => version.id === versionId)
      ?.versionNumber;
  }, [prototype, versionId]);

  // プロトタイプが存在しない場合
  if (!prototype) return null;

  return (
    <SocketProvider socket={socket}>
      <PrototypeVersionIdProvider prototypeVersionId={versionId}>
        <Canvas
          prototypeName={prototype.name}
          parts={parts}
          properties={properties}
          players={players}
          prototypeVersionNumber={versionNumber}
          groupId={prototype.groupId}
          prototypeType="EDIT"
          validationResults={validationResults}
        />
      </PrototypeVersionIdProvider>
    </SocketProvider>
  );
};

export default PrototypeEdit;
