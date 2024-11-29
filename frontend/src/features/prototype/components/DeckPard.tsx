import React from 'react';
import { Part } from '../type';
import { Socket } from 'socket.io-client';

interface DeckProps {
  prototypeId: number;
  deck: Part;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: number) => void;
  onSelectPart: (part: Part) => void;
  socket: Socket;
  order: number;
}

const DeckPart: React.FC<DeckProps> = ({
  prototypeId,
  deck,
  onDragStart,
  onSelectPart,
  socket,
  order,
}) => {
  const handleShuffle = () => {
    socket.emit('SHUFFLE_DECK', { prototypeId, deckId: deck.id });
  };

  return (
    <div
      onDoubleClick={handleShuffle}
      draggable
      onDragStart={(e) => onDragStart(e, deck.id)}
      onClick={() => onSelectPart(deck)}
      className={`absolute cursor-move border border-gray-300 rounded p-2 shadow-sm text-xs`}
      style={{
        left: deck.position.x,
        top: deck.position.y,
        width: deck.width,
        height: deck.height,
        backgroundColor: deck.color || 'white',
        zIndex: order,
      }}
    >
      {deck.name}
    </div>
  );
};

export default DeckPart;
