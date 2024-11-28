'use client';

import React, { useEffect, useRef, useState } from 'react';

import PartCreationView from '@/features/prototype/components/PartCreationView';
import PartMainView from '@/features/prototype/components/PartMainView';
import PartPropertyView from '@/features/prototype/components/PartPropertyView';
import { useParams } from 'next/navigation';
import { Prototype, AllPart, Hand, Deck } from '@/features/prototype/type';
import { io } from 'socket.io-client';
import { PART_TYPE } from '@/features/prototype/const';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const EditPrototypePage: React.FC = () => {
  const { prototypeId } = useParams();
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [parts, setParts] = useState<AllPart[]>([]);
  const [selectedPart, setSelectedPart] = useState<AllPart | null>(null);
  const [isCreationViewOpen, setIsCreationViewOpen] = useState(true);
  const [isPropertyViewOpen, setIsPropertyViewOpen] = useState(true);
  const mainViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/prototypes/${prototypeId}`)
      .then((response) => response.json())
      .then((data) => setPrototype(data))
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [prototypeId]);

  // NOTE: 他クライアントからパーツ更新の配信があった際にプロパティビューを最新化する
  // 選択中のパーツを依存配列に入れると無限ループになってしまうため、意図的に依存配列から外している
  useEffect(() => {
    if (!selectedPart || !isPropertyViewOpen) return;

    const updatedPart = parts.find((part) => part.id === selectedPart?.id);
    if (!updatedPart) return;

    setSelectedPart(updatedPart);
  }, [parts]);

  useEffect(() => {
    socket.on('UPDATE_PARTS', (parts) => {
      setParts(parts);
    });

    return () => {
      socket.off('UPDATE_PARTS');
    };
  }, []);

  const handleAddPart = (part: AllPart) => {
    socket.emit('ADD_PART', part);
  };

  const handleMovePart = (id: number, position: { x: number; y: number }) => {
    socket.emit('MOVE_PART', { id, position });
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

  const handleMoveCardRelateToHand = (partId: number, x: number, y: number) => {
    const droppedPart = parts.find((part) => part.id === partId);
    if (droppedPart?.type !== PART_TYPE.CARD) return;

    // カードの場合、手札との重なりをチェック
    const cardPosition = { x, y };
    const cardSize = {
      width: droppedPart.width,
      height: droppedPart.height,
    };

    // ドロップ位置の真下にある手札を探す
    const hands = parts.filter(
      (part) => part.type === PART_TYPE.HAND
    ) as Hand[];
    const targetHand = hands.find((hand) => {
      const handPosition = { x: hand.position.x, y: hand.position.y };
      const handSize = { width: hand.width, height: hand.height };
      return isPartOnOtherPart(
        cardPosition,
        cardSize,
        droppedPart.order,
        handPosition,
        handSize,
        hand.order
      );
    });
    const previousHandIds = hands
      .filter(
        (hand) => hand.cardIds.includes(partId) && hand.id !== targetHand?.id
      )
      .map((hand) => hand.id);

    // NOTE: カードが手札の上にのる/カードが手札の上から離れる時だけ配信
    if (targetHand || previousHandIds.length > 0)
      socket.emit('MOVE_CARD_RELATE_TO_HAND', {
        cardId: partId,
        nextHandId: targetHand?.id,
        previousHandIds,
      });
  };

  const handleMoveCardRelateToDeck = (partId: number, x: number, y: number) => {
    const droppedPart = parts.find((part) => part.id === partId);
    if (droppedPart?.type !== PART_TYPE.CARD) return;

    // カードの場合、山札との重なりをチェック
    const cardPosition = { x, y };
    const cardSize = {
      width: droppedPart.width,
      height: droppedPart.height,
    };

    // ドロップ位置の真下にある山札を探す
    const decks = parts.filter(
      (part) => part.type === PART_TYPE.DECK
    ) as Deck[];
    const targetDeck = decks.find((deck) => {
      const deckPosition = { x: deck.position.x, y: deck.position.y };
      const deckSize = { width: deck.width, height: deck.height };
      return isPartOnOtherPart(
        cardPosition,
        cardSize,
        droppedPart.order,
        deckPosition,
        deckSize,
        deck.order
      );
    });
    const previousDeckIds = decks
      .filter(
        (deck) => deck.cardIds.includes(partId) && deck.id !== targetDeck?.id
      )
      .map((deck) => deck.id);

    // NOTE: カードが山札の上にのる/カードが山札の上から離れる時だけ配信
    if (targetDeck || previousDeckIds.length > 0) {
      socket.emit('MOVE_CARD_RELATE_TO_DECK', {
        cardId: partId,
        nextDeckId: targetDeck?.id,
        previousDeckIds,
      });
      // 山札の上に置くときは裏返す
      if (previousDeckIds.length === 0 && targetDeck?.id) {
        socket.emit('FLIP_CARD', { cardId: partId, isNextFlipped: true });
      }
      // 山札の上から離れるときは表にする
      if (previousDeckIds.length > 0 && !targetDeck?.id) {
        socket.emit('FLIP_CARD', { cardId: partId, isNextFlipped: false });
      }
    }
  };

  const handleSelectPart = (part: AllPart) => {
    setSelectedPart(part);
    if (!isPropertyViewOpen) {
      setIsPropertyViewOpen(true);
    }
  };

  const handleUpdatePart = (updatedPart: AllPart) => {
    setParts((prevParts) =>
      prevParts.map((part) => (part.id === updatedPart.id ? updatedPart : part))
    );
    socket.emit('UPDATE_PART', updatedPart);
  };

  const handleDuplicatePart = (part: AllPart) => {
    const newPart = {
      ...part,
      id: Date.now(),
      position: {
        x: part.position.x + 10,
        y: part.position.y + 10,
      },
    };
    setParts((prevParts) => [...prevParts, newPart]);
    socket.emit('ADD_PART', newPart);
  };

  if (!prototype) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
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
          />
        )}
      </div>
      <div
        ref={mainViewRef}
        className={`flex-1 transition-width duration-300 ${
          isCreationViewOpen && isPropertyViewOpen ? 'w-1/2' : 'w-full'
        }`}
      >
        <PartMainView
          parts={parts}
          onMovePart={handleMovePart}
          onSelectPart={handleSelectPart}
          onMoveCardOnHand={handleMoveCardRelateToHand}
          onMoveCardOnDeck={handleMoveCardRelateToDeck}
          socket={socket}
        />
      </div>
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
            players={prototype.players}
            selectedPart={selectedPart}
            onUpdatePart={handleUpdatePart}
            onDuplicatePart={handleDuplicatePart}
          />
        )}
      </div>
    </div>
  );
};

export default EditPrototypePage;
