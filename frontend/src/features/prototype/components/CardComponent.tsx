import React, { useCallback, useEffect, useState } from 'react';
import { Card, Part } from '../type';
import { Socket } from 'socket.io-client';

interface CardProps {
  part: Card;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
  onSelectPart: (part: Part) => void;
  socket: Socket;
}

const CardComponent: React.FC<CardProps> = ({
  part,
  onDragStart,
  onSelectPart,
  socket,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = useCallback(
    (isNextFlipped: boolean) => {
      // NOTE: このカードの反転により、socket通信が来た場合に、再度反転させてしまうと無限ループとなってしまうため、反転させる必要があるかをチェックする
      if (part.isReversible && isFlipped != isNextFlipped) {
        setIsFlipped((prevState) => !prevState);
        socket.emit('FLIP_CARD', {
          cardId: part.id,
          isNextFlipped: !isFlipped,
        });
      }
    },
    [isFlipped, part.id, part.isReversible, socket]
  );

  useEffect(() => {
    socket.on('FLIP_CARD', ({ cardId, isNextFlipped }) => {
      if (cardId === part.id) {
        flipCard(isNextFlipped);
      }
    });

    return () => {
      socket.off('FLIP_CARD');
    };
  }, [flipCard, part.id, socket]);

  const handleDoubleClick = () => {
    flipCard(!isFlipped);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={(e) => onDragStart(e, part.id)}
      onClick={() => onSelectPart(part)}
      className={`absolute cursor-move border border-gray-300 rounded p-2 shadow-sm text-xs
        ${part.isReversible ? 'hover:bg-gray-50' : ''} 
        ${isFlipped ? 'flipped' : ''}`}
      style={{
        left: part.position.x,
        top: part.position.y,
        width: part.width,
        height: part.height,
        backgroundColor: part.color || 'white',
        transition: 'transform 0.6s',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      {isFlipped ? '' : part.name}
    </div>
  );
};

export default CardComponent;
