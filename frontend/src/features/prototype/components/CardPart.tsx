import React, { useCallback, useEffect, useState } from 'react';
import { Card, Part } from '../type';
import { Socket } from 'socket.io-client';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';

interface CardProps {
  card: Card;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
  onSelectPart: (part: Part) => void;
  socket: Socket;
  order: number;
}

const CardPart: React.FC<CardProps> = ({
  card,
  onDragStart,
  onSelectPart,
  socket,
  order,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = useCallback(
    (isNextFlipped: boolean) => {
      // NOTE: このカードの反転により、socket通信が来た場合に、再度反転させてしまうと無限ループとなってしまうため、反転させる必要があるかをチェックする
      if (card.isReversible && isFlipped != isNextFlipped) {
        setIsFlipped((prevState) => !prevState);
        socket.emit('FLIP_CARD', {
          cardId: card.id,
          isNextFlipped: !isFlipped,
        });
      }
    },
    [isFlipped, card.id, card.isReversible, socket]
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

  const handleDoubleClick = () => {
    flipCard(!isFlipped);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => onSelectPart(card)}
      className={`absolute cursor-move border border-gray-300 rounded p-2 shadow-sm text-xs
        ${isFlipped ? 'flipped' : ''}`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: card.width,
        height: card.height,
        backgroundColor: card.color || 'white',
        transition: 'transform 0.6s',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        zIndex: order,
      }}
    >
      {isFlipped ? '' : card.name}
      {card.isReversible ? (
        <VscSync className="absolute bottom-1 right-1" size={16} />
      ) : (
        <VscSyncIgnored className="absolute bottom-1 right-1" size={16} />
      )}
    </div>
  );
};

export default CardPart;
