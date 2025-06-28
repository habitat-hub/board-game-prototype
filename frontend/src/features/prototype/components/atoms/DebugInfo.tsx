'use client';

import React, { useState } from 'react';

import { Part, PartProperty } from '@/api/types';
import { useDebugMode } from '@/features/prototype/hooks/useDebugMode';
import { useMemoryUsage } from '@/features/prototype/hooks/useMemoryUsage';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { useRenderPerformance } from '@/features/prototype/hooks/useRenderPerformance';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';

interface DebugInfoProps {
  // Camera info
  camera: {
    x: number;
    y: number;
    scale: number;
  };
  // Prototype info
  prototypeName: string;
  prototypeVersionNumber: number;
  isVersionPrototype: boolean;
  groupId: string;
  prototypeType: 'MASTER' | 'VERSION' | 'INSTANCE';
  // Data
  parts: Part[];
  properties: PartProperty[];
  cursors: Record<string, CursorInfo>;
  selectedPartIds: number[];
  mode: GameBoardMode;
}

const DebugInfo: React.FC<DebugInfoProps> = ({
  camera,
  prototypeName,
  prototypeVersionNumber,
  isVersionPrototype,
  groupId,
  prototypeType,
  parts,
  properties,
  cursors,
  selectedPartIds,
  mode,
}) => {
  const { showDebugInfo } = useDebugMode();

  // パフォーマンス計測（レンダリングは常時、メモリはデバッグ表示時のみ）
  const renderPerformance = useRenderPerformance();
  const { memoryInfo, formatMemory } = useMemoryUsage(showDebugInfo ? 2000 : 0);
  const { metrics: performanceMetrics, resetMetrics } = usePerformanceTracker();

  const [activeTab, setActiveTab] = useState<
    'info' | 'perf' | 'data' | 'parts'
  >('info');

  if (!showDebugInfo) return null;

  const tabs = [
    { id: 'info' as const, label: 'Info' },
    { id: 'perf' as const, label: 'Perf' },
    { id: 'data' as const, label: 'Data' },
    { id: 'parts' as const, label: 'Parts' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="text-sm h-[50vh] overflow-y-auto">
            <div className="border-b border-white border-opacity-20 mb-2 pb-1">
              <strong>Current Status</strong>
            </div>
            <div className="mb-1.5">
              <span className="font-bold">Mode:</span> {mode}
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
            <div className="mb-1">
              <div className="text-xs text-gray-300 mb-0.5">
                Top-Left Position:
              </div>
              <div>X: {Math.round(camera.x)}</div>
              <div>Y: {Math.round(camera.y)}</div>
            </div>
            <div className="mb-1">
              <div className="text-xs text-gray-300 mb-0.5">
                Center Position:
              </div>
              <div>
                X: {Math.round(camera.x + window.innerWidth / 2 / camera.scale)}
              </div>
              <div>
                Y:{' '}
                {Math.round(camera.y + window.innerHeight / 2 / camera.scale)}
              </div>
            </div>
            <div>Zoom: {camera.scale.toFixed(2)}x</div>

            <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
              <strong>Prototype</strong>
            </div>
            <div>Name: {prototypeName}</div>
            <div>Version: {prototypeVersionNumber || 'N/A'}</div>
            <div>Group ID: {groupId}</div>
            <div>Type: {prototypeType}</div>
            <div>Is Master Preview: {isVersionPrototype ? 'Yes' : 'No'}</div>

            <div className="border-b border-white border-opacity-20 mt-3 mb-2 pb-1">
              <strong>Multiplayer</strong>
            </div>
            <div>
              <div className="font-semibold">
                Cursors: {Object.keys(cursors).length}
              </div>
              {Object.keys(cursors).length > 0 && (
                <div className="ml-2.5 text-xs">
                  <div>
                    Active Users:{' '}
                    {Object.values(cursors)
                      .map((c) => c.userName)
                      .join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'perf':
        return (
          <div className="text-sm h-[50vh] overflow-y-auto">
            <div className="border-b border-white border-opacity-20 mb-2 pb-1">
              <strong>Performance</strong>
            </div>

            {/* レンダリングパフォーマンス */}
            <div className="mb-1.5">
              <div className="font-semibold mb-1">Rendering</div>
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
              <div>
                Frame Time: {renderPerformance.renderTime.toFixed(2)} ms
              </div>
              <div>
                Avg Frame: {renderPerformance.avgFrameTime.toFixed(2)} ms
              </div>
              <div>
                Worst Frame: {renderPerformance.worstFrameTime.toFixed(2)} ms
              </div>
            </div>

            {/* メモリ使用量 */}
            <div className="mb-1.5">
              <div className="font-semibold mb-1">Memory</div>
              <div>Used: {formatMemory(memoryInfo.usedJSHeapSize)}</div>
              <div>Total: {formatMemory(memoryInfo.totalJSHeapSize)}</div>
              <div>Limit: {formatMemory(memoryInfo.jsHeapSizeLimit)}</div>
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
                <div className="font-semibold mb-1">Operation Times</div>
                <div className="text-[11px] max-h-32 overflow-y-auto">
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
          </div>
        );

      case 'data':
        return (
          <div className="text-sm h-[50vh] overflow-y-auto">
            <div className="border-b border-white border-opacity-20 mb-2 pb-1">
              <strong>Data Overview</strong>
            </div>
            <div className="mb-2">
              <div className="font-semibold">Parts: {parts.length}</div>
              {parts.length > 0 && (
                <div className="ml-2.5 text-xs space-y-1">
                  <div>
                    Types: {[...new Set(parts.map((p) => p.type))].join(', ')}
                  </div>
                  <div>
                    With Parent: {parts.filter((p) => p.parentId).length}
                  </div>
                  <div>
                    Reversible Cards:{' '}
                    {
                      parts.filter((p) => p.type === 'card' && p.isReversible)
                        .length
                    }
                  </div>
                  <div>
                    Flipped Cards:{' '}
                    {
                      parts.filter((p) => p.type === 'card' && p.isFlipped)
                        .length
                    }
                  </div>
                  <div>
                    Hands with Owner:{' '}
                    {parts.filter((p) => p.type === 'hand' && p.ownerId).length}
                  </div>
                  <div className="text-gray-300">
                    Order Range:{' '}
                    {Math.min(...parts.map((p) => p.order)).toFixed(2)} -{' '}
                    {Math.max(...parts.map((p) => p.order)).toFixed(2)}
                  </div>
                  <div>Total Properties: {properties.length}</div>
                  <div>
                    Properties with Images:{' '}
                    {properties.filter((p) => p.imageId).length}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'parts':
        return (
          <div className="text-sm h-[50vh] overflow-y-auto">
            {/* Parts詳細 - partIdごとにpropertiesもまとめて表示 */}
            <div className="mb-3">
              <div className="font-semibold mb-1">
                Parts with Properties ({parts.length})
              </div>
              <div className="text-[11px]">
                {parts
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  )
                  .map((part, index) => {
                    // このパーツに関連するプロパティを取得
                    const partProperties = properties.filter(
                      (prop) => prop.partId === part.id
                    );

                    return (
                      <div
                        key={`part-${index}`}
                        className="mb-2 border border-white border-opacity-10 p-1 rounded-sm"
                      >
                        <div className="font-bold text-blue-300">
                          ID: {part.id} | Type: {part.type}
                        </div>
                        <div>
                          Position: ({part.position.x}, {part.position.y})
                        </div>
                        <div>
                          Size: {part.width} × {part.height}
                        </div>
                        <div>
                          Order:{' '}
                          {typeof part.order === 'number'
                            ? part.order.toFixed(3)
                            : 'N/A'}
                        </div>
                        <div>Version ID: {part.prototypeId}</div>
                        {part.parentId !== undefined &&
                          part.parentId !== null && (
                            <div>Parent ID: {part.parentId}</div>
                          )}
                        {part.originalPartId !== undefined &&
                          part.originalPartId !== null && (
                            <div>Original ID: {part.originalPartId}</div>
                          )}
                        <div>
                          Child Types: [
                          {part.configurableTypeAsChild.join(', ')}]
                        </div>
                        {part.type === 'card' && (
                          <>
                            {part.isReversible !== undefined && (
                              <div>
                                Reversible: {part.isReversible ? 'Yes' : 'No'}
                              </div>
                            )}
                            {part.isFlipped !== undefined && (
                              <div>
                                Flipped: {part.isFlipped ? 'Yes' : 'No'}
                              </div>
                            )}
                          </>
                        )}
                        {part.type === 'hand' &&
                          part.ownerId !== undefined &&
                          part.ownerId !== null && (
                            <div>Owner ID: {part.ownerId}</div>
                          )}
                        {part.type === 'deck' &&
                          part.canReverseCardOnDeck !== undefined && (
                            <div>
                              Can Reverse Cards:{' '}
                              {part.canReverseCardOnDeck ? 'Yes' : 'No'}
                            </div>
                          )}

                        {/* このパーツのプロパティ */}
                        {partProperties.length > 0 && (
                          <div className="mt-2 border-t border-white border-opacity-10 pt-1">
                            <div className="text-yellow-300 font-bold text-[10px]">
                              Properties ({partProperties.length}):
                            </div>
                            {partProperties.map((prop, propIndex) => (
                              <div
                                key={`prop-${propIndex}`}
                                className="ml-2 mt-1 text-[10px] border-l border-white border-opacity-10 pl-1"
                              >
                                <div className="text-green-300">
                                  Side: {prop.side}
                                </div>
                                <div>Name: {prop.name}</div>
                                <div>Color: {prop.color}</div>
                                <div>Text Color: {prop.textColor}</div>
                                <div>ImageID: {prop.imageId || 'None'}</div>
                                {prop.description && (
                                  <div>Description: {prop.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-gray-400 text-[10px] mt-1">
                          Created: {new Date(part.createdAt).toLocaleString()}
                        </div>
                        <div className="text-gray-400 text-[10px]">
                          Updated: {new Date(part.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-2.5 rounded-md font-mono text-sm z-[1000] w-96 max-h-[80vh] flex flex-col">
      {/* タブヘッダー */}
      <div className="flex border-b border-white border-opacity-20 mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-1 py-1 text-[11px] cursor-pointer transition-colors text-center ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-white text-opacity-70 hover:text-opacity-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>

      <div className="text-[11px] mt-2 pt-2 border-t border-white border-opacity-20">
        Press Cmd+i (Mac) or Ctrl+i (Windows) to toggle debug panel
      </div>
    </div>
  );
};

export default DebugInfo;
