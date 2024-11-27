import Link from 'next/link';
import React from 'react';
import { AllPart } from '../type';

interface PartMainViewProps {
  parts: AllPart[];
  onMovePart: (id: number, position: { x: number; y: number }) => void;
  onSelectPart: (part: AllPart) => void;
  onMoveCardOnHand: (partId: number, x: number, y: number) => void;
}

const PartMainView: React.FC<PartMainViewProps> = ({
  parts,
  onMovePart,
  onSelectPart,
  onMoveCardOnHand,
}) => {
  const handleDragStart = (e: React.DragEvent, partId: number) => {
    e.dataTransfer.setData('partId', partId.toString());
    onSelectPart(parts.find((part) => part.id === partId) as AllPart);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const partId = parseInt(e.dataTransfer.getData('partId'));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onMovePart(partId, { x, y });
    onMoveCardOnHand(partId, x, y);
  };

  return (
    <div className="flex-1 p-4 flex flex-col h-full">
      <div className="mb-4">
        <Link
          href="/prototypes"
          className="text-blue-500 hover:text-blue-700 hover:underline"
        >
          プロトタイプ一覧へ
        </Link>
      </div>
      <div
        className="border border-gray-300 p-4 relative flex-1"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {parts.map((part) => (
          <div
            key={part.id}
            draggable
            onDragStart={(e) => handleDragStart(e, part.id)}
            onClick={() => onSelectPart(part)}
            className="absolute cursor-move border border-gray-300 rounded p-2 shadow-sm text-xs"
            style={{
              left: part.position.x,
              top: part.position.y,
              width: part.width,
              height: part.height,
              backgroundColor: part.color || 'white',
            }}
          >
            {part.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartMainView;
