'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useProject } from '@/api/hooks/useProject';
import { Prototype } from '@/api/types';
import SocketGameBoard from '@/features/prototype/components/organisms/SocketGameBoard';
import { SelectedPartsProvider } from '@/features/prototype/contexts/SelectedPartsContext';
import { SocketProvider } from '@/features/prototype/contexts/SocketContext';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';
import { useUser } from '@/hooks/useUser';

export default function PrototypeTemplate() {
  const { user } = useUser();
  const { getProject } = useProject();
  const socketRef = useRef<Socket | null>(null);

  // プロジェクトID, プロトタイプID
  const { projectId, prototypeId } = useParams<{
    projectId: string;
    prototypeId: string;
  }>();

  // 選択されたプロトタイプ
  const [selectedPrototype, setSelectedPrototype] = useState<
    Prototype | undefined
  >(undefined);

  // ゲームボードモード
  const gameBoardMode = useMemo(() => {
    switch (selectedPrototype?.type) {
      case 'MASTER':
        return GameBoardMode.CREATE;
      case 'VERSION':
        return GameBoardMode.PREVIEW;
      default:
        return GameBoardMode.PLAY;
    }
  }, [selectedPrototype?.type]);

  // プロトタイプの取得
  useEffect(() => {
    getProject(projectId)
      .then((project) => {
        const selectedPrototype = project.prototypes.find(
          (p) => p.id === prototypeId
        );
        setSelectedPrototype(selectedPrototype);
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [getProject, projectId, prototypeId]);

  // socket通信の設定
  useEffect(() => {
    // Socket接続を作成
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL);

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return selectedPrototype && user?.id && socketRef.current ? (
    <SocketProvider socket={socketRef.current}>
      <SelectedPartsProvider>
        <SocketGameBoard
          prototypeName={selectedPrototype?.name || ''}
          projectId={projectId}
          prototypeId={prototypeId}
          userId={user.id}
          gameBoardMode={gameBoardMode}
        />
      </SelectedPartsProvider>
    </SocketProvider>
  ) : null;
}
