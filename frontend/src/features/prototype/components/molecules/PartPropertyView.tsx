import React, { useState, useEffect } from 'react';
import { AllPart, AllPartKey, Player } from '@/features/prototype/type';
import { PART_TYPE } from '@/features/prototype/const';

interface PartPropertyViewProps {
  selectedPart: AllPart | null;
  onUpdatePart: (updatedPart: AllPart) => void;
  onDuplicatePart: (part: AllPart) => void;
  players: Player[];
}

const colors = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
  '#FFC0CB', // Pink
  '#FFFFFF', // White
  '#808080', // Gray
];

const PartPropertyView: React.FC<PartPropertyViewProps> = ({
  selectedPart,
  onUpdatePart,
  onDuplicatePart,
  players,
}) => {
  const [part, setPart] = useState<AllPart | null>(selectedPart);

  useEffect(() => {
    setPart(selectedPart);
  }, [selectedPart]);

  /**
   * プロパティを変更する
   * @param key - プロパティのキー
   * @param value - プロパティの値
   */
  const handlePropertyChange = (key: AllPartKey, value: string | boolean) => {
    if (part) {
      const updatedPart = { ...part, [key]: value };
      setPart(updatedPart);
      onUpdatePart(updatedPart);
    }
  };

  if (!part) {
    return <div className="p-4">コンポーネントを選択してください</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">プロパティビュー</h2>
      <button
        onClick={() => onDuplicatePart(part)}
        className="bg-blue-500 text-white p-2 rounded mb-4"
      >
        複製
      </button>
      <div className="mb-4">
        <label className="block mb-1">名前</label>
        <input
          type="text"
          value={part.name}
          onChange={(e) => handlePropertyChange('name', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">説明</label>
        <textarea
          value={part.description}
          onChange={(e) => handlePropertyChange('description', e.target.value)}
          className="w-full p-2 border rounded h-24 resize-none"
          rows={4}
        />
      </div>
      {part.type === PART_TYPE.CARD && 'isReversible' in part && (
        <div className="mb-4">
          <label className="block mb-1">反転可能か？</label>
          <input
            type="checkbox"
            checked={part.isReversible}
            onChange={(e) =>
              handlePropertyChange('isReversible', e.target.checked)
            }
          />
        </div>
      )}
      {part.type === PART_TYPE.HAND && 'ownerId' in part && (
        <div className="mb-4">
          <label className="block mb-1">オーナー</label>
          <select
            value={part.ownerId || ''}
            onChange={(e) => handlePropertyChange('ownerId', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">選択してください</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mb-4">
        <label className="block mb-1">カラー</label>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handlePropertyChange('color', color)}
              className={`w-8 h-8 rounded-full border-2 ${
                part.color === color ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={part.color || '#FFFFFF'}
            onChange={(e) => handlePropertyChange('color', e.target.value)}
            className="w-8 h-8"
          />
          <span className="text-sm text-gray-600">カスタムカラーを選択</span>
        </div>
      </div>
    </div>
  );
};

export default PartPropertyView;
