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
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2.5 rounded-md font-mono text-sm z-[1000] max-h-[60vh] overflow-y-auto">
      <div className="border-b border-white border-opacity-20 mb-2 pb-1">
        <strong>Current Status</strong>
      </div>
      <div
        className={`font-bold mb-1.5 ${selectedPartIds.length ? 'text-yellow-400' : 'text-white'}`}
      >
        Selected Parts: {selectedPartIds.length}
      </div>
      {selectedPartIds.length > 0 && (
        <div className="ml-2.5 text-xs mb-1.5">
          IDs: {selectedPartIds.join(', ')}
        </div>
      )}
      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Camera</strong>
      </div>
      <div>X: {Math.round(camera.x)}</div>
      <div>Y: {Math.round(camera.y)}</div>
      <div>Zoom: {camera.scale.toFixed(2)}x</div>

      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Performance</strong>
      </div>

      {/* レンダリングパフォーマンス */}
      <div className="mb-1.5">
        <div>
          FPS:{' '}
          <span
            className={
              renderPerformance.fps < 30
                ? 'text-red-400'
                : renderPerformance.fps < 50
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }
          >
            {renderPerformance.fps}
          </span>
        </div>
        <div>Frame Time: {renderPerformance.renderTime.toFixed(2)} ms</div>
        <div>Avg Frame: {renderPerformance.avgFrameTime.toFixed(2)} ms</div>
        <div>Worst Frame: {renderPerformance.worstFrameTime.toFixed(2)} ms</div>
      </div>

      {/* メモリ使用量 */}
      <div className="mb-1.5">
        <div>Memory Used: {formatMemory(memoryInfo.usedJSHeapSize)}</div>
        <div>Memory Total: {formatMemory(memoryInfo.totalJSHeapSize)}</div>
        <div>Memory Limit: {formatMemory(memoryInfo.jsHeapSizeLimit)}</div>
        {memoryInfo.usedPercentage !== undefined && (
          <div>
            Usage:{' '}
            <span
              className={
                memoryInfo.usedPercentage > 80
                  ? 'text-red-400'
                  : memoryInfo.usedPercentage > 60
                    ? 'text-yellow-400'
                    : 'text-green-400'
              }
            >
              {memoryInfo.usedPercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* オペレーション実行時間 */}
      {Object.keys(performanceMetrics).length > 0 && (
        <div className="mb-1.5">
          <div className="mb-1">Operation Times:</div>
          <div className="text-[11px] max-h-30 overflow-y-auto">
            {Object.entries(performanceMetrics).map(([op, metric]) => (
              <div
                key={op}
                className="mb-1 border border-white border-opacity-10 p-0.5 rounded-sm"
              >
                <div className="font-bold">{op}</div>
                <div className="ml-2">
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
            className="bg-white bg-opacity-20 border border-white border-opacity-30 text-white px-1.5 py-0.5 rounded text-[10px] cursor-pointer mt-1 hover:bg-opacity-30 transition-colors"
          >
            Reset Metrics
          </button>
        </div>
      )}

      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Prototype</strong>
      </div>
      <div>Name: {prototypeName}</div>
      <div>Version: {prototypeVersionNumber || 'N/A'}</div>
      <div>Group ID: {groupId}</div>
      <div>Type: {prototypeType}</div>
      <div>Is Master Preview: {isMasterPreview ? 'Yes' : 'No'}</div>

      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Data</strong>
      </div>
      <div>Parts: {parts.length}</div>
      {parts.length > 0 && (
        <div className="ml-2.5 text-xs">
          First part: {parts[0].id} ({parts[0].type})
        </div>
      )}
      <div>Properties: {properties.length}</div>
      {properties.length > 0 && (
        <div className="ml-2.5 text-xs">
          First property: {properties[0].name}
        </div>
      )}
      <div>Players: {players.length}</div>
      {players.length > 0 && (
        <div className="ml-2.5 text-xs">
          First player: {players[0].playerName}
        </div>
      )}
      <div>Cursors: {Object.keys(cursors).length}</div>

      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Detailed Information</strong>
      </div>
      <div className="text-[11px] max-h-48 overflow-y-auto">
        {properties.map((prop, index) => (
          <div key={`prop-${index}`} className="mb-2">
            <div>
              ID: {prop.partId}, Side: {prop.side}
            </div>
            <div>Name: {prop.name}</div>
            <div>Color: {prop.color}</div>
            <div>ImageID: {prop.imageId || 'None'}</div>
          </div>
        ))}
      </div>

      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Detailed Parts</strong>
      </div>
      <div className="text-[11px] max-h-48 overflow-y-auto">
        {parts.map((part, index) => (
          <div key={`part-${index}`} className="mb-2">
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
      <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
        <strong>Detailed Cursors</strong>
      </div>
      <div className="text-[11px] max-h-48 overflow-y-auto">
        {Object.entries(cursors)
          .slice(0, 3)
          .map(([, cursor]) => (
            <div key={cursor.userId} className="mb-2">
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

      <div className="text-[11px] mt-3">
        Press Cmd+i (Mac) or Ctrl+i (Windows) to toggle debug panel
      </div>
    </div>
  );
};

export default DebugInfo;
