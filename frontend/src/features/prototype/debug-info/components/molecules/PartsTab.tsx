'use client';

import React from 'react';

import { Part, PartProperty } from '@/api/types';

interface PartsTabProps {
  parts: Part[];
  properties: PartProperty[];
}

const PartsTab: React.FC<PartsTabProps> = ({ parts, properties }) => {
  return (
    <div className="text-sm h-[50vh] overflow-y-auto">
      {/* Parts details - each part with its properties */}
      <div className="mb-3">
        <div className="font-semibold mb-1">
          Parts with Properties ({parts.length})
        </div>
        <div className="text-[11px]">
          {[...parts]
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )
            .map((part) => {
              const partProperties = properties.filter(
                (prop) => prop.partId === part.id
              );

              return (
                <div
                  key={part.id}
                  className="mb-2 border border-kibako-white border-opacity-10 p-1 rounded-sm"
                >
                  <div className="font-bold text-blue-300">
                    ID: {part.id} | Type: {part.type}
                  </div>
                  <div>Position: ({part.position.x}, {part.position.y})</div>
                  <div>Size: {part.width} × {part.height}</div>
                  <div>
                    Order:{' '}
                    {typeof part.order === 'number'
                      ? part.order.toFixed(3)
                      : 'N/A'}
                  </div>
                  <div>Version ID: {part.prototypeId}</div>
                  {part.type === 'card' && (
                    <>
                      {part.frontSide !== undefined && (
                        <div>Front Side: {part.frontSide}</div>
                      )}
                    </>
                  )}
                  {part.type === 'hand' &&
                    part.ownerId !== undefined &&
                    part.ownerId !== null && (
                      <div>Owner ID: {part.ownerId}</div>
                    )}

                  {/* Properties of this part */}
                  {partProperties.length > 0 && (
                    <div className="mt-2 border-t border-kibako-white border-opacity-10 pt-1">
                      <div className="text-yellow-300 font-bold text-[10px]">
                        Properties ({partProperties.length}):
                      </div>
                      {partProperties.map((prop, propIndex) => (
                        <div
                          key={`${part.id}-${prop.side}-${prop.name}-${propIndex}`}
                          className="ml-2 mt-1 text-[10px] border-l border-kibako-white border-opacity-10 pl-1"
                        >
                          <div className="text-green-300">Side: {prop.side}</div>
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
};

export default PartsTab;
