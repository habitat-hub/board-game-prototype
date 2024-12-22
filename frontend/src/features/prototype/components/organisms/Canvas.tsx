'use client';

import React, { useCallback, useState } from 'react';

import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { Camera, CanvasMode, CanvasState } from '@/features/prototype/type';

export default function Canvas() {
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });

  const onWheel = useCallback((e: React.WheelEvent) => {
    // TODO: スクロールの上限を決める
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
      zoom: camera.zoom,
    }));
  }, []);

  return (
    <div className="flex h-full w-full">
      <main className="h-full w-full">
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
              {/* TODO: 実際のパーツに置き換える */}
              {['0', '1', '2', '3'].map((layerId) => (
                <rect
                  key={layerId}
                  id={layerId}
                  style={{
                    fill: 'red',
                    transform: `translate(${50 * 2 * Number(layerId)}px, ${
                      50 * 2 * Number(layerId)
                    }px)`,
                  }}
                  width={100}
                  height={100}
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
    </div>
  );
}
