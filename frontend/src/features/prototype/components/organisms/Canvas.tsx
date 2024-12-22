'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { AiOutlineTool } from 'react-icons/ai';

import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import {
  AllPart,
  Camera,
  CanvasMode,
  CanvasState,
  Player,
} from '@/features/prototype/type';

import Sidebars from '../molecules/Sidebars';
import RandomNumberTool from '../atoms/RandomNumberTool';

interface CanvasProps {
  prototypeName: string;
  prototypeVersionId: string;
  parts: AllPart[];
  players: Player[];
  socket: Socket;
}

export default function Canvas({
  prototypeName,
  prototypeVersionId,
  parts,
  players,
  socket,
}: CanvasProps) {
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [leftIsMinimized, setLeftIsMinimized] = useState(false);
  const mainViewRef = useRef<HTMLDivElement>(null);
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);
  const onWheel = useCallback((e: React.WheelEvent) => {
    // TODO: スクロールの上限を決める
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
      zoom: camera.zoom,
    }));
  }, []);

  /**
   * パーツの追加
   * @param part - 追加するパーツ
   */
  const onAddPart = (
    part: Omit<AllPart, 'id' | 'prototypeVersionId' | 'order'>
  ) => {
    socket.emit('ADD_PART', { prototypeVersionId, part });
  };

  return (
    <div className="flex h-full w-full">
      <main className="h-full w-full" ref={mainViewRef}>
        <div className="h-full w-full touch-none">
          <svg
            onWheel={onWheel}
            className="h-full w-full"
            onContextMenu={(e) => e.preventDefault()}
          >
            <g
              style={{
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
              }}
            >
              {parts.map((part) => (
                <rect
                  key={part.id}
                  id={part.id.toString()}
                  style={{
                    fill: 'red',
                    transform: `translate(${part.position.x}px, ${part.position.y}px)`,
                  }}
                  width={part.width}
                  height={part.height}
                />
              ))}
            </g>
          </svg>
        </div>
      </main>

      <ToolsBar
        canvasState={canvasState}
        setCanvasState={(newState) => setState(newState)}
        zoomIn={() => {
          setCamera((camera) => ({ ...camera, zoom: camera.zoom + 0.1 }));
        }}
        zoomOut={() => {
          setCamera((camera) => ({ ...camera, zoom: camera.zoom - 0.1 }));
        }}
        canZoomIn={camera.zoom < 2}
        canZoomOut={camera.zoom > 0.5}
      />
      <Sidebars
        prototypeName={prototypeName}
        leftIsMinimized={leftIsMinimized}
        setLeftIsMinimized={setLeftIsMinimized}
        players={players}
        onAddPart={onAddPart}
        mainViewRef={mainViewRef}
      />
      {/* 乱数ツールボタン */}
      <button
        onClick={() => setIsRandomToolOpen(!isRandomToolOpen)}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-2 rounded-full shadow-lg"
      >
        <AiOutlineTool size={30} />
      </button>
      {/* 乱数計算UI */}
      {isRandomToolOpen && (
        <RandomNumberTool onClose={() => setIsRandomToolOpen(false)} />
      )}
    </div>
  );
}
