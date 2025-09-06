'use client';

import React from 'react';

import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { GameBoardMode } from '@/features/prototype/types';

interface InfoTabProps {
  camera: {
    x: number;
    y: number;
    scale: number;
  };
  prototypeName: string;
  projectId: string;
  mode: GameBoardMode;
}

const InfoTab: React.FC<InfoTabProps> = ({
  camera,
  prototypeName,
  projectId,
  mode,
}) => {
  const { selectedPartIds } = useSelectedParts();

  return (
    <div className="text-sm h-[50vh] overflow-y-auto">
      <div className="border-b border-kibako-white border-opacity-20 mb-2 pb-1">
        <strong>Current Status</strong>
      </div>
      <div className="mb-1.5">
        <span className="font-bold">Mode:</span> {mode}
      </div>
      <div
        className={`font-bold mb-1.5 ${
          selectedPartIds.length ? 'text-yellow-400' : 'text-kibako-white'
        }`}
      >
        Selected Parts: {selectedPartIds.length}
      </div>
      {selectedPartIds.length > 0 && (
        <div className="ml-2.5 text-xs mb-1.5">
          IDs: {selectedPartIds.join(', ')}
        </div>
      )}

      <div className="border-b border-kibako-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Camera</strong>
      </div>
      <div className="mb-1">
        <div className="text-xs text-gray-300 mb-0.5">Top-Left Position:</div>
        <div>X: {Math.round(camera.x)}</div>
        <div>Y: {Math.round(camera.y)}</div>
      </div>
      <div className="mb-1">
        <div className="text-xs text-gray-300 mb-0.5">Center Position:</div>
        <div>
          X: {Math.round(camera.x + window.innerWidth / 2 / camera.scale)}
        </div>
        <div>
          Y: {Math.round(camera.y + window.innerHeight / 2 / camera.scale)}
        </div>
      </div>
      <div>Zoom: {camera.scale.toFixed(2)}x</div>

      <div className="border-b border-kibako-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Prototype</strong>
      </div>
      <div>Name: {prototypeName}</div>
      <div>Project ID: {projectId}</div>
    </div>
  );
};

export default InfoTab;
