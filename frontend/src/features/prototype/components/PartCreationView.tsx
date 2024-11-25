import React from 'react';

import { Part, Prototype } from '../type';

interface PartCreationViewProps {
  prototype: Prototype;
  onAddPart: (part: Part) => void;
  mainViewRef: React.RefObject<HTMLDivElement>;
}

const PartCreationView: React.FC<PartCreationViewProps> = ({
  prototype,
  onAddPart,
  mainViewRef,
}) => {
  const parts = ['Button', 'Input', 'Card'];

  const handleCreatePart = (part: string) => {
    if (mainViewRef.current) {
      // メインビューの幅と高さを取得
      const mainViewWidth = mainViewRef.current.offsetWidth;
      const mainViewHeight = mainViewRef.current.offsetHeight;

      // 中央の座標を計算
      const centerX = mainViewWidth / 2;
      const centerY = mainViewHeight / 2;

      const newPart = {
        id: Date.now(),
        name: part,
        position: { x: centerX, y: centerY },
      };
      onAddPart(newPart);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 text-center">{`${
        prototype.name ? `${prototype.name}` : 'コンポーネント作成'
      }`}</h2>
      <ul>
        {parts.map((part) => (
          <li key={part} className="mb-2">
            <button
              onClick={() => handleCreatePart(part)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {part} 作成
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PartCreationView;
