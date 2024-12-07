import React from 'react';
import { Socket } from 'socket.io-client';

import { Part } from '@/features/prototype/type';

import PartWrapper from './PartWrapper';

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
  /**
   * デッキをシャッフルする
   */
  const handleShuffle = () => {
    socket.emit('SHUFFLE_DECK', { prototypeId, deckId: deck.id });
  };

  return (
    <PartWrapper
      part={deck}
      order={order}
      onClick={() => onSelectPart(deck)}
      onDragStart={(e) => onDragStart(e, deck.id)}
      onDoubleClick={handleShuffle}
    >
      {deck.name}
    </PartWrapper>
  );
};

export default DeckPart;
