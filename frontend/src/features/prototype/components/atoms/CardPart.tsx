import React, { useCallback, useEffect, useState } from 'react';
import { Card, Hand, Part, Player } from '@/features/prototype/type';
import { Socket } from 'socket.io-client';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';
import { VIEW_MODE } from '../../const';
import PartWrapper from './PartWrapper';

interface CardProps {
  userId: number;
  hands: Hand[];
  players: Player[];
  viewMode: string;
  prototypeId: number;
  card: Card;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
  onSelectPart: (part: Part) => void;
  socket: Socket;
  order: number;
}

const CardPart: React.FC<CardProps> = ({
  userId,
  hands,
  players,
  viewMode,
  prototypeId,
  card,
  onDragStart,
  onSelectPart,
  socket,
  order,
}) => {
  // カードが反転しているかどうか
  const [isFlipped, setIsFlipped] = useState(card.isFlipped);

  /**
   * カードを反転させる
   * @param isNextFlipped - 次の反転状態
   */
  const flipCard = useCallback(
    (isNextFlipped: boolean) => {
      // NOTE: このカードの反転により、socket通信が来た場合に、再度反転させてしまうと無限ループとなってしまうため、反転させる必要があるかをチェックする
      if (card.isReversible && isFlipped != isNextFlipped) {
        setIsFlipped((prevState) => !prevState);
        socket.emit('FLIP_CARD', {
          prototypeId,
          cardId: card.id,
          isNextFlipped: !isFlipped,
        });
      }
    },
    [card.isReversible, card.id, isFlipped, socket, prototypeId]
  );

  useEffect(() => {
    socket.on('FLIP_CARD', ({ cardId, isNextFlipped }) => {
      if (cardId === card.id) {
        flipCard(isNextFlipped);
      }
    });

    return () => {
      socket.off('FLIP_CARD');
    };
  }, [flipCard, card.id, socket]);

  /**
   * カードをダブルクリックしたときは、カードを反転させる
   */
  const handleDoubleClick = () => {
    flipCard(!isFlipped);
  };

  const parentHand = hands.find((hand) => hand.id === card.parentId);
  const isOwner =
    parentHand &&
    players.find((player) => player.id === parentHand.ownerId)?.userId ===
      userId;
  // NOTE: ゲームプレイ中の場合は、オーナー以外カードを見れない
  if (viewMode !== VIEW_MODE.EDIT && parentHand && !isOwner) {
    return (
      <PartWrapper
        part={card}
        order={order}
        customClassName={'flipped'}
        onDragStart={(e) => onDragStart(e, card.id)}
      >
        <VscSyncIgnored className="absolute bottom-1 right-1" size={16} />
      </PartWrapper>
    );
  }

  return (
    <PartWrapper
      part={card}
      order={order}
      onClick={() => onSelectPart(card)}
      onDoubleClick={handleDoubleClick}
      onDragStart={(e) => onDragStart(e, card.id)}
      customClassName={`${isFlipped ? 'flipped' : ''}`}
      customStyle={{
        transition: 'transform 0.6s',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      {isFlipped ? '' : card.name}
      {card.isReversible ? (
        <VscSync className="absolute bottom-1 right-1" size={16} />
      ) : (
        <VscSyncIgnored className="absolute bottom-1 right-1" size={16} />
      )}
    </PartWrapper>
  );
};

export default CardPart;
