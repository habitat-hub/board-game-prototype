'use client';

import React from 'react';

import { useMemoryUsage } from '@/features/prototype/hooks/useMemoryUsage';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { useRenderPerformance } from '@/features/prototype/hooks/useRenderPerformance';

const PerfTab: React.FC = () => {
  const renderPerformance = useRenderPerformance();
  const { memoryInfo, formatMemory } = useMemoryUsage(2000);
  const { metrics: performanceMetrics, resetMetrics } = usePerformanceTracker();

  return (
    <div className="text-sm h-[50vh] overflow-y-auto">
      <div className="border-b border-kibako-white border-opacity-20 mb-2 pb-1">
        <strong>Performance</strong>
      </div>

      {/* Rendering performance */}
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
        <div>Frame Time: {renderPerformance.renderTime.toFixed(2)} ms</div>
        <div>Avg Frame: {renderPerformance.avgFrameTime.toFixed(2)} ms</div>
        <div>Worst Frame: {renderPerformance.worstFrameTime.toFixed(2)} ms</div>
      </div>

      {/* Memory usage */}
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

      {/* Operation execution time */}
      {Object.keys(performanceMetrics).length > 0 && (
        <div className="mb-1.5">
          <div className="font-semibold mb-1">Operation Times</div>
          <div className="text-[11px] max-h-32 overflow-y-auto">
            {Object.entries(performanceMetrics).map(([op, metric]) => (
              <div
                key={op}
                className="mb-1 border border-kibako-white border-opacity-10 p-0.5 rounded-sm"
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
            className="bg-kibako-white bg-opacity-20 border border-kibako-white border-opacity-30 text-kibako-white px-1.5 py-0.5 rounded text-[10px] cursor-pointer mt-1 hover:bg-opacity-30 transition-colors"
          >
            Reset Metrics
          </button>
        </div>
      )}
    </div>
  );
};

export default PerfTab;
