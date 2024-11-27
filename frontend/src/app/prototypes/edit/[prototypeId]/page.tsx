'use client';

import React, { useEffect, useRef, useState } from 'react';

import PartCreationView from '@/features/prototype/components/PartCreationView';
import PartMainView from '@/features/prototype/components/PartMainView';
import PartPropertyView from '@/features/prototype/components/PartPropertyView';
import { useParams } from 'next/navigation';
import { Prototype, AllPart } from '@/features/prototype/type';
import { io } from 'socket.io-client';

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
