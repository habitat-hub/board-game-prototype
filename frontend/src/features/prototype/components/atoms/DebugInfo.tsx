'use client';

import React from 'react';

import { Part, PartProperty, Player } from '@/api/types';
import { useDebugMode } from '@/features/prototype/hooks/useDebugMode';
import { useMemoryUsage } from '@/features/prototype/hooks/useMemoryUsage';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { useRenderPerformance } from '@/features/prototype/hooks/useRenderPerformance';
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
  prototypeVersionNumber: string;
  isMasterPreview: boolean;
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
  isMasterPreview,
  groupId,
  prototypeType,
  parts,
  properties,
  players,
  cursors,
  selectedPartIds,
}) => {
  const { showDebugInfo } = useDebugMode();
  const renderPerformance = useRenderPerformance();
  const { memoryInfo, formatMemory } = useMemoryUsage();
  const { metrics: performanceMetrics, resetMetrics } = usePerformanceTracker();

  if (!showDebugInfo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
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
        <strong>Current Status</strong>
      </div>
      <div
        style={{
          fontWeight: 'bold',
          color: selectedPartIds.length ? '#ffcc00' : 'white',
          marginBottom: '5px',
        }}
      >
        Selected Parts: {selectedPartIds.length}
      </div>
      {selectedPartIds.length > 0 && (
        <div
          style={{ marginLeft: '10px', fontSize: '12px', marginBottom: '5px' }}
        >
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
        <strong>Performance</strong>
      </div>

      {/* レンダリングパフォーマンス */}
      <div style={{ marginBottom: '5px' }}>
        <div>
          FPS:{' '}
          <span
            style={{
              color:
                renderPerformance.fps < 30
                  ? '#ff6b6b'
                  : renderPerformance.fps < 50
                    ? '#ffd166'
                    : '#06d6a0',
            }}
          >
            {renderPerformance.fps}
          </span>
        </div>
        <div>Frame Time: {renderPerformance.renderTime.toFixed(2)} ms</div>
        <div>Avg Frame: {renderPerformance.avgFrameTime.toFixed(2)} ms</div>
        <div>Worst Frame: {renderPerformance.worstFrameTime.toFixed(2)} ms</div>
      </div>

      {/* メモリ使用量 */}
      <div style={{ marginBottom: '5px' }}>
        <div>Memory Used: {formatMemory(memoryInfo.usedJSHeapSize)}</div>
        <div>Memory Total: {formatMemory(memoryInfo.totalJSHeapSize)}</div>
        <div>Memory Limit: {formatMemory(memoryInfo.jsHeapSizeLimit)}</div>
        {memoryInfo.usedPercentage !== undefined && (
          <div>
            Usage:{' '}
            <span
              style={{
                color:
                  memoryInfo.usedPercentage > 80
                    ? '#ff6b6b'
                    : memoryInfo.usedPercentage > 60
                      ? '#ffd166'
                      : '#06d6a0',
              }}
            >
              {memoryInfo.usedPercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* オペレーション実行時間 */}
      {Object.keys(performanceMetrics).length > 0 && (
        <div style={{ marginBottom: '5px' }}>
          <div style={{ marginBottom: '3px' }}>Operation Times:</div>
          <div
            style={{ fontSize: '11px', maxHeight: '120px', overflowY: 'auto' }}
          >
            {Object.entries(performanceMetrics).map(([op, metric]) => (
              <div
                key={op}
                style={{
                  marginBottom: '4px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '2px',
                  borderRadius: '2px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{op}</div>
                <div style={{ marginLeft: '8px' }}>
                  <div>Last: {metric.lastTime.toFixed(2)} ms</div>
                  <div>Avg: {metric.avgTime.toFixed(2)} ms</div>
                  <div>
                    Min/Max: {metric.minTime.toFixed(2)}/
                    {metric.maxTime.toFixed(2)} ms
                  </div>
                  <div>Count: {metric.count}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={resetMetrics}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '3px',
            }}
          >
            Reset Metrics
          </button>
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
        <strong>Prototype</strong>
      </div>
      <div>Name: {prototypeName}</div>
      <div>Version: {prototypeVersionNumber || 'N/A'}</div>
      <div>Group ID: {groupId}</div>
      <div>Type: {prototypeType}</div>
      <div>Is Master Preview: {isMasterPreview ? 'Yes' : 'No'}</div>

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
