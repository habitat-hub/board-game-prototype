'use client';

import React, { useEffect, useRef, useState } from 'react';
import PartCreationView from '@/features/prototype/components/molecules/PartCreationView';
import PartMainView from '@/features/prototype/components/molecules/PartMainView';
import PartPropertyView from '@/features/prototype/components/molecules/PartPropertyView';
import { useParams } from 'next/navigation';
import { Prototype, AllPart, User, Player } from '@/features/prototype/type';
import { io } from 'socket.io-client';
import { PART_TYPE, VIEW_MODE } from '@/features/prototype/const';
import GameSettingsView from '../molecules/GameSettingView';
import axiosInstance from '@/utils/axiosInstance';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const PrototypeComponent: React.FC<{ viewMode: string }> = ({ viewMode }) => {
  const { prototypeId } = useParams();
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [parts, setParts] = useState<AllPart[]>([]);
  const [selectedPart, setSelectedPart] = useState<AllPart | null>(null);
  const [isCreationViewOpen, setIsCreationViewOpen] = useState(true);
  const [isPropertyViewOpen, setIsPropertyViewOpen] = useState(true);
  const [isGameSettingsViewOpen, setIsGameSettingsViewOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const mainViewRef = useRef<HTMLDivElement>(null);
  const [accessibleUsers, setAccessibleUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    axiosInstance
      .get(`/api/prototypes/${prototypeId}`)
      .then((response) => {
        const { prototype, accessibleUsers } = response.data;
        if (prototype.isEdit && viewMode !== VIEW_MODE.EDIT) {
          window.location.href = `/prototypes/${prototype.id}/edit`;
          return;
        }
        if (prototype.isPreview && viewMode !== VIEW_MODE.PREVIEW) {
          window.location.href = `/prototypes/${prototype.id}/preview`;
          return;
        }
        if (prototype.isPublic && viewMode !== VIEW_MODE.PUBLIC) {
          window.location.href = `/prototypes/${prototype.id}/published`;
          return;
        }
        setPrototype(prototype);
        setAccessibleUsers(accessibleUsers);
      })
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [prototypeId, viewMode]);

  useEffect(() => {
    axiosInstance
      .get('/auth/user')
      .then((response) => setUserId(response.data.id))
      .catch((error) => console.error('Error fetching user:', error));
  }, []);

  // NOTE: 他クライアントからパーツ更新の配信があった際にプロパティビューを最新化する
  // 選択中のパーツを依存配列に入れると無限ループになってしまうため、意図的に依存配列から外している
  useEffect(() => {
    if (!selectedPart || !isPropertyViewOpen) return;

    const updatedPart = parts.find((part) => part.id === selectedPart?.id);
    if (!updatedPart) return;

    setSelectedPart(updatedPart);
  }, [parts]);

  useEffect(() => {
    // サーバーに接続した後、特定のプロトタイプに参加
    socket.emit('JOIN_PROTOTYPE', Number(prototypeId));

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
  }, [prototypeId]);

  const handleAddPart = (part: Omit<AllPart, 'id' | 'prototypeId'>) => {
    socket.emit('ADD_PART', { prototypeId: Number(prototypeId), part });
  };

  const handleMovePart = (id: number, position: { x: number; y: number }) => {
    socket.emit('MOVE_PART', {
      prototypeId: Number(prototypeId),
      id,
      position,
    });
  };

  const isPartOnOtherPart = (
    partPosition: { x: number; y: number },
    partSize: { width: number; height: number },
    partOrder: number,
    otherPartPosition: { x: number; y: number },
    otherPartSize: { width: number; height: number },
    otherPartOrder: number
  ) => {
    const partCenterX = partPosition.x + partSize.width / 2;
    const partCenterY = partPosition.y + partSize.height / 2;

    return (
      partCenterX >= otherPartPosition.x &&
      partCenterX <= otherPartPosition.x + otherPartSize.width &&
      partCenterY >= otherPartPosition.y &&
      partCenterY <= otherPartPosition.y + otherPartSize.height &&
      partOrder > otherPartOrder
    );
  };

  const handleMoveCard = (partId: number, x: number, y: number) => {
    const card = parts.find(
      (part) => part.id === partId && part.type === PART_TYPE.CARD
    );
    if (!card) return;

    // カードの場合、他の親になりえるパーツとの重なりをチェック
    const cardPosition = { x, y };
    const cardSize = {
      width: card.width,
      height: card.height,
    };

    // ドロップ位置の真下にある親になりえるパーツを探す
    const parentParts = parts.filter((part) =>
      part.configurableTypeAsChild.includes(PART_TYPE.CARD)
    );
    const targetParentPart = parentParts.find((parentPart) => {
      const parentPartPosition = {
        x: parentPart.position.x,
        y: parentPart.position.y,
      };
      const parentPartSize = {
        width: parentPart.width,
        height: parentPart.height,
      };
      return isPartOnOtherPart(
        cardPosition,
        cardSize,
        card.order,
        parentPartPosition,
        parentPartSize,
        parentPart.order
      );
    });

    // 親が変わっていない場合は何もしない
    if (
      (!card.parentId && !targetParentPart) ||
      card.parentId === targetParentPart?.id
    )
      return;

    // NOTE: カードが親パーツの上にのる/カードが親パーツから離れる時だけ配信
    if (card.parentId || targetParentPart)
      socket.emit('UPDATE_CARD_PARENT', {
        prototypeId: Number(prototypeId),
        cardId: partId,
        nextParentId: targetParentPart?.id,
      });

    const previousParentPart = parts.find((part) => part.id === card.parentId);
    // NOTE: 山札から山札以外、山札以外から山札に変わるときは裏返す
    if (
      (previousParentPart?.type === PART_TYPE.DECK &&
        targetParentPart?.type !== PART_TYPE.DECK) ||
      (previousParentPart?.type !== PART_TYPE.DECK &&
        targetParentPart?.type === PART_TYPE.DECK)
    ) {
      // 山札の上に置くときは裏返す、山札から離れるときは表にする
      socket.emit('FLIP_CARD', {
        prototypeId: Number(prototypeId),
        cardId: card.id,
        isNextFlipped: targetParentPart?.type === PART_TYPE.DECK,
      });
    }
  };

  const handleSelectPart = (part: AllPart) => {
    setSelectedPart(part);
    if (!isPropertyViewOpen) {
      setIsPropertyViewOpen(true);
    }
  };

  const handleUpdatePart = (updatedPart: AllPart) => {
    socket.emit('UPDATE_PART', {
      prototypeId: Number(prototypeId),
      updatedPart,
    });
  };

  // NOTE: 同じプロトタイプ内での複製
  const handleDuplicatePart = (part: AllPart) => {
    // NOTE: idは自動生成されるため、partからidを削除
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = part;

    const newPart = {
      ...rest,
      position: {
        x: part.position.x + 10,
        y: part.position.y + 10,
      },
      order: part.order + 0.1, // FIXME: パーツの重なりをチェックして順番をずらす(コレだと他のパーツと重なる可能性がある)
    };
    socket.emit('ADD_PART', {
      prototypeId: Number(prototypeId),
      part: newPart,
    });
  };

  const handleUpdatePlayerUser = (playerId: number, userId: number | null) => {
    socket.emit('UPDATE_PLAYER_USER', {
      prototypeId: Number(prototypeId),
      playerId,
      userId,
    });
  };

  if (!prototype || !userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full">
      {viewMode === VIEW_MODE.EDIT && (
        <div
          className={`transition-width duration-300 ${
            isCreationViewOpen ? 'w-1/6' : 'w-10'
          }`}
        >
          <button
            onClick={() => setIsCreationViewOpen(!isCreationViewOpen)}
            className="bg-blue-500 text-white p-2"
          >
            {isCreationViewOpen ? '＜' : '＞'}
          </button>
          {isCreationViewOpen && (
            <PartCreationView
              prototype={prototype}
              parts={parts}
              onAddPart={handleAddPart}
              mainViewRef={mainViewRef}
              players={players}
            />
          )}
        </div>
      )}
      <div
        ref={mainViewRef}
        className={`flex-1 transition-width duration-300 ${
          isCreationViewOpen && isPropertyViewOpen ? 'w-1/2' : 'w-full'
        }`}
      >
        <PartMainView
          userId={userId}
          prototypeId={Number(prototypeId)}
          parts={parts}
          players={players}
          onMovePart={handleMovePart}
          onSelectPart={handleSelectPart}
          onMoveCard={handleMoveCard}
          socket={socket}
          viewMode={viewMode}
        />
      </div>
      {viewMode === VIEW_MODE.EDIT && (
        <div
          className={`transition-width duration-300 ${
            isPropertyViewOpen ? 'w-1/6' : 'w-10'
          }`}
        >
          <div className="flex justify-end">
            <button
              onClick={() => setIsPropertyViewOpen(!isPropertyViewOpen)}
              className="bg-blue-500 text-white p-2"
            >
              {isPropertyViewOpen ? '＞' : '＜'}
            </button>
          </div>
          {isPropertyViewOpen && (
            <PartPropertyView
              players={players}
              selectedPart={selectedPart}
              onUpdatePart={handleUpdatePart}
              onDuplicatePart={handleDuplicatePart}
            />
          )}
        </div>
      )}
      {viewMode !== VIEW_MODE.EDIT && (
        <div
          className={`transition-width duration-300 ${
            isGameSettingsViewOpen ? 'w-1/6' : 'w-10'
          }`}
        >
          <div className="flex justify-end">
            <button
              onClick={() => setIsGameSettingsViewOpen(!isGameSettingsViewOpen)}
              className="bg-blue-500 text-white p-2"
            >
              {isGameSettingsViewOpen ? '＞' : '＜'}
            </button>
          </div>
          {isGameSettingsViewOpen && (
            <GameSettingsView
              players={players}
              accessibleUsers={accessibleUsers}
              onUserChange={handleUpdatePlayerUser}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PrototypeComponent;
