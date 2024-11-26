'use client';

import React, { useEffect, useRef, useState } from 'react';

import PartCreationView from '@/features/prototype/components/PartCreationView';
import PartMainView from '@/features/prototype/components/PartMainView';
import PartPropertyView from '@/features/prototype/components/PartPropertyView';
import { useParams } from 'next/navigation';
import { Prototype, Part } from '@/features/prototype/type';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL);

const EditPrototypePage: React.FC = () => {
  const { prototypeId } = useParams();
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
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

  useEffect(() => {
    socket.on('UPDATE_PARTS', (parts) => {
      setParts(parts);
    });

    return () => {
      socket.off('UPDATE_PARTS');
    };
  }, []);

  const handleAddPart = (part: Part) => {
    socket.emit('ADD_PART', part);
  };

  const handleMovePart = (id: number, position: { x: number; y: number }) => {
    socket.emit('MOVE_PART', { id, position });
  };

  const handleSelectPart = (part: Part) => {
    setSelectedPart(part);
    if (!isPropertyViewOpen) {
      setIsPropertyViewOpen(true);
    }
  };

  const handleUpdatePart = (updatedPart: Part) => {
    setParts((prevParts) =>
      prevParts.map((part) => (part.id === updatedPart.id ? updatedPart : part))
    );
    socket.emit('UPDATE_PART', updatedPart);
  };

  const handleDuplicatePart = (part: Part) => {
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
