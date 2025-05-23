'use client';

import React from 'react';

import { Part, PartProperty, Player } from '@/api/types';
import { useDebugMode } from '@/features/prototype/hooks/useDebugMode';
import { CursorInfo } from '@/features/prototype/types/cursor';

interface DebugInfoProps {
  // Camera info
  camera: {
    x: number;
    y: number;
    scale: number;
  };
  // Prototype info
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  prototypeType: 'EDIT' | 'PREVIEW';
  // Data
  parts: Part[];
  properties: PartProperty[];
  players: Player[];
  cursors: Record<string, CursorInfo>;
  selectedPartIds: number[];
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  camera,
  prototypeName,
  prototypeVersionNumber,
  groupId,
  prototypeType,
  parts,
  properties,
  players,
  cursors,
  selectedPartIds,
}) => {
  const { showDebugInfo } = useDebugMode();

  if (!showDebugInfo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 1000,
        maxHeight: '50vh',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        <strong>Camera</strong>
      </div>
      <div>X: {Math.round(camera.x)}</div>
      <div>Y: {Math.round(camera.y)}</div>
      <div>Zoom: {camera.scale.toFixed(2)}x</div>

      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '12px',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        <strong>Prototype</strong>
      </div>
      <div>Name: {prototypeName}</div>
      <div>Version: {prototypeVersionNumber || 'N/A'}</div>
      <div>Group ID: {groupId}</div>
      <div>Type: {prototypeType}</div>

      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '12px',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        <strong>Data</strong>
      </div>
      <div>Parts: {parts.length}</div>
      {parts.length > 0 && (
        <div style={{ marginLeft: '10px', fontSize: '12px' }}>
          First part: {parts[0].id} ({parts[0].type})
        </div>
      )}
      <div>Properties: {properties.length}</div>
      {properties.length > 0 && (
        <div style={{ marginLeft: '10px', fontSize: '12px' }}>
          First property: {properties[0].name}
        </div>
      )}
      <div>Players: {players.length}</div>
      {players.length > 0 && (
        <div style={{ marginLeft: '10px', fontSize: '12px' }}>
          First player: {players[0].playerName}
        </div>
      )}
      <div>Cursors: {Object.keys(cursors).length}</div>
      <div>Selected: {selectedPartIds.length}</div>
      {selectedPartIds.length > 0 && (
        <div style={{ marginLeft: '10px', fontSize: '12px' }}>
          IDs: {selectedPartIds.join(', ')}
        </div>
      )}

      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '12px',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        <strong>Detailed Information</strong>
      </div>
      <div style={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto' }}>
        {properties.map((prop, index) => (
          <div key={`prop-${index}`} style={{ marginBottom: '8px' }}>
            <div>
              ID: {prop.partId}, Side: {prop.side}
            </div>
            <div>Name: {prop.name}</div>
            <div>Color: {prop.color}</div>
            <div>ImageID: {prop.imageId || 'None'}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '12px',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        <strong>Detailed Parts</strong>
      </div>
      <div style={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto' }}>
        {parts.map((part, index) => (
          <div key={`part-${index}`} style={{ marginBottom: '8px' }}>
            <div>
              ID: {part.id}, Type: {part.type}
            </div>
            <div>Pos: {JSON.stringify(part.position)}</div>
            <div>
              Size: {part.width}x{part.height}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed cursors section */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginTop: '12px',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        <strong>Detailed Cursors</strong>
      </div>
      <div style={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto' }}>
        {Object.entries(cursors)
          .slice(0, 3)
          .map(([, cursor]) => (
            <div key={cursor.userId} style={{ marginBottom: '8px' }}>
              <div>
                ID: {cursor.userId}, Name: {cursor.userName}
              </div>
              <div>
                Pos: {cursor.position.x}, {cursor.position.y}
              </div>
            </div>
          ))}
        {Object.entries(cursors).length > 3 && (
          <div>...and {Object.entries(cursors).length - 3} more</div>
        )}
      </div>

      <div style={{ fontSize: '11px', marginTop: '12px' }}>
        Press Cmd+i (Mac) or Ctrl+i (Windows) to toggle debug panel
      </div>
    </div>
  );
};

export default DebugInfo;
