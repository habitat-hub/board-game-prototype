import Link from 'next/link';
import React, { Fragment, useState } from 'react';
import { AllPart, Card, Hand, Player } from '@/features/prototype/type';
import { Socket } from 'socket.io-client';
import { PART_TYPE, VIEW_MODE } from '@/features/prototype/const';
import CardPart from '@/features/prototype/components/atoms/CardPart';
import DeckPart from '@/features/prototype/components/atoms/DeckPard';
import axiosInstance from '@/utils/axiosInstance';

interface PartMainViewProps {
  userId: number;
  prototypeId: number;
  parts: AllPart[];
  players: Player[];
  onMovePart: (id: number, position: { x: number; y: number }) => void;
  onSelectPart: (part: AllPart) => void;
  onMoveCard: (partId: number, x: number, y: number) => void;
  socket: Socket;
  viewMode: string;
}

const PartMainView: React.FC<PartMainViewProps> = ({
  userId,
  prototypeId,
  parts,
  players,
  onMovePart,
  onSelectPart,
  onMoveCard,
  socket,
  viewMode,
}) => {
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  const handleClickPreview = async () => {
    if (viewMode !== VIEW_MODE.EDIT) {
      return;
    }

    setIsPreviewLoading(true);
    try {
      const response = await axiosInstance.post(
        `/api/prototypes/${prototypeId}/preview`
      );

      const previewPrototype = response.data;
      window.location.href = `/prototypes/${previewPrototype.id}/preview`;
    } catch (error) {
      console.error('Error creating preview:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClickPublic = async () => {
    if (viewMode !== VIEW_MODE.PREVIEW) {
      return;
    }

    setIsPublicLoading(true);
    try {
      const response = await axiosInstance.post(
        `/api/prototypes/${prototypeId}/published`
      );

      const publishedPrototype = response.data;
      window.location.href = `/prototypes/${publishedPrototype.id}/published`;
    } catch (error) {
      console.error('Error creating public:', error);
    } finally {
      setIsPublicLoading(false);
    }
  };

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
    onMoveCard(partId, x, y);
  };

  const handleInvite = () => {
    window.location.href = `/prototypes/${prototypeId}/invite`;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <Link
          href="/prototypes"
          className="text-blue-500 hover:text-blue-700 hover:underline"
        >
          プロトタイプ一覧へ
        </Link>
        <div className="flex">
          {viewMode === VIEW_MODE.EDIT && (
            <button
              onClick={handleClickPreview}
              disabled={isPreviewLoading}
              className={`bg-yellow-500 text-white p-1 rounded transition ${
                isPreviewLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-yellow-600'
              }`}
              style={{ fontSize: '0.875rem' }}
            >
              プレビュー版配信
            </button>
          )}
          {viewMode === VIEW_MODE.PREVIEW && (
            <button
              onClick={handleClickPublic}
              disabled={isPublicLoading}
              className={`bg-green-500 text-white p-2 rounded hover:bg-green-600 transition ${
                isPublicLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ fontSize: '0.875rem' }}
            >
              公開版配信
            </button>
          )}
          <button
            onClick={handleInvite}
            className="ml-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
            style={{ fontSize: '0.875rem' }}
          >
            招待
          </button>
        </div>
      </div>
      <div
        className="border border-gray-300 p-2 relative flex-1"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {parts
          .sort((a, b) => a.order - b.order)
          .map((part, index) => (
            <Fragment key={part.id}>
              {part.type === PART_TYPE.CARD && (
                <CardPart
                  userId={userId}
                  hands={
                    parts.filter((p) => p.type === PART_TYPE.HAND) as Hand[]
                  }
                  players={players}
                  viewMode={viewMode}
                  prototypeId={prototypeId}
                  card={part as Card}
                  onDragStart={handleDragStart}
                  onSelectPart={onSelectPart}
                  socket={socket}
                  order={index}
                />
              )}
              {part.type === PART_TYPE.DECK && (
                <DeckPart
                  prototypeId={prototypeId}
                  deck={part}
                  onDragStart={handleDragStart}
                  onSelectPart={onSelectPart}
                  socket={socket}
                  order={index}
                />
              )}
              {part.type !== 'card' && part.type !== 'deck' && (
                <div
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
                    zIndex: index,
                  }}
                >
                  {part.name}
                </div>
              )}
            </Fragment>
          ))}
      </div>
    </div>
  );
};

export default PartMainView;
