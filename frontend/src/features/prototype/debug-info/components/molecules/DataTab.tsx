'use client';

import React from 'react';

import { Part, PartProperty } from '@/__generated__/api/client';

interface DataTabProps {
  parts: Part[];
  properties: PartProperty[];
}

const DataTab: React.FC<DataTabProps> = ({ parts, properties }) => {
  return (
    <div className="text-sm h-[50vh] overflow-y-auto">
      <div className="border-b border-kibako-white border-opacity-20 mb-2 pb-1">
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
              Front Side Cards:{' '}
              {
                parts.filter(
                  (p) => p.type === 'card' && p.frontSide === 'front'
                ).length
              }
            </div>
            <div>
              Hands with Owner:{' '}
              {parts.filter((p) => p.type === 'hand' && p.ownerId).length}
            </div>
            <div className="text-gray-300">
              Order Range: {Math.min(...parts.map((p) => p.order)).toFixed(2)} -{' '}
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
};

export default DataTab;
