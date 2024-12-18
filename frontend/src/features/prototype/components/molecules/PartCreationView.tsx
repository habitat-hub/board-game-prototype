import React, { useMemo } from 'react';

import {
  AllPart,
  Card,
  Hand,
  Player,
  Prototype,
} from '@/features/prototype/type';

const PART_DEFAULT_CONFIG = {
  CARD: {
    id: 'card',
    name: 'カード',
    width: 100,
    height: 150,
    description: '',
    color: '#FFFFFF',
    isReversible: false,
    configurableTypeAsChild: [],
  },
  TOKEN: {
    id: 'token',
    name: 'token',
    width: 50,
    height: 50,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: [],
  },
  HAND: {
    id: 'hand',
    name: '手札',
    width: 400,
    height: 150,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: ['card'],
  },
  DECK: {
    id: 'deck',
    name: '山札',
    width: 150,
    height: 150,
    description: '',
    color: '#FFFFFF',
    configurableTypeAsChild: ['card'],
  },
};

interface PartCreationViewProps {
  prototype: Prototype;
  parts: AllPart[];
  onAddPart: (part: Omit<AllPart, 'id' | 'prototypeId'>) => void;
  mainViewRef: React.RefObject<HTMLDivElement>;
  players: Player[];
}

const PartCreationView: React.FC<PartCreationViewProps> = ({
  prototype,
  parts,
  players,
  onAddPart,
  mainViewRef,
}) => {
  const partIds = ['card', 'token', 'hand', 'deck'];
  const maxOrder = useMemo(() => {
    return parts.length > 0 ? Math.max(...parts.map((part) => part.order)) : 0;
  }, [parts]);

  /**
   * コンポーネントを作成する
   * @param partId - コンポーネントのID
   */
  const handleCreatePart = (partId: string) => {
    if (mainViewRef.current) {
      // メインビューの幅と高さを取得
      const mainViewWidth = mainViewRef.current.offsetWidth;
      const mainViewHeight = mainViewRef.current.offsetHeight;

      // 中央の座標を計算
      const centerX = mainViewWidth / 2;
      const centerY = mainViewHeight / 2;

      const partConfig = Object.values(PART_DEFAULT_CONFIG).find(
        (part) => part.id === partId
      );

      if (!partConfig) {
        return;
      }

      const newPart: Omit<AllPart, 'id' | 'prototypeId'> = {
        type: partId,
        parentId: null,
        name: partConfig.name,
        description: partConfig.description,
        color: partConfig.color,
        position: { x: centerX, y: centerY },
        width: partConfig.width,
        height: partConfig.height,
        order: maxOrder + 0.1,
        configurableTypeAsChild: partConfig.configurableTypeAsChild,
      };
      if (partId === 'card') {
        (newPart as Card).isReversible = (
          partConfig as typeof PART_DEFAULT_CONFIG.CARD
        ).isReversible;
        (newPart as Card).isFlipped = false;
      }
      if (partId === 'hand') {
        (newPart as Hand).ownerId = players[0].id;
      }

      onAddPart(newPart);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 text-center">{`${
        prototype.name ? `${prototype.name}` : 'コンポーネント作成'
      }`}</h2>
      <ul>
        {partIds.map((partId) => (
          <li key={partId} className="mb-2">
            <button
              onClick={() => handleCreatePart(partId)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {
                Object.values(PART_DEFAULT_CONFIG).find(
                  (part) => part.id === partId
                )?.name
              }
              作成
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PartCreationView;
