'use client';

import Link from 'next/link';
import React from 'react';
import { BsDoorOpenFill } from 'react-icons/bs';
import { FaUsers } from 'react-icons/fa';
import { IoTrash } from 'react-icons/io5';

import { Prototype, PrototypeGroup } from '@/api/types';
import formatDate from '@/utils/dateFormat';

interface PlayRoomCardProps {
  prototype: Prototype;
  onDelete: (prototypeId: string, prototypeInstanceId: string) => Promise<void>;
  prototypeGroup: PrototypeGroup; // プロトタイプグループ情報（プレイヤー数を表示するため）
}

const PlayRoomCard: React.FC<PlayRoomCardProps> = ({
  prototype,
  onDelete,
  prototypeGroup,
}) => {
  return (
    <Link href={`/prototypes/${prototypeGroup.id}/${prototype.id}/play`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-wood-light/20 group">
        <div className="bg-gradient-to-r from-wood-lightest to-wood-lightest/50 p-3 border-b border-wood-light/20">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-wood-darkest group-hover:text-header transition-colors">
              プレイルーム
              {prototype.versionNumber}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(prototypeGroup.id, prototype.id);
              }}
              className="text-wood-dark hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
              title="ルームを削除"
            >
              <IoTrash className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-wood">
              <BsDoorOpenFill className="h-5 w-5 text-wood-dark group-hover:text-header transition-colors" />
              <span className="text-sm font-medium">入室</span>
            </div>
            <div className="text-xs text-wood-dark">
              {formatDate(prototype.createdAt, true)}
            </div>
          </div>

          {/* プレイヤー人数情報 */}
          {prototype && (
            <div className="flex items-center gap-1 mt-2 text-xs text-wood-dark">
              <FaUsers className="h-3 w-3" />
              <span>
                {prototype.minPlayers === prototype.maxPlayers
                  ? `${prototype.minPlayers}人`
                  : `${prototype.minPlayers}〜${prototype.maxPlayers}人`}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PlayRoomCard;
