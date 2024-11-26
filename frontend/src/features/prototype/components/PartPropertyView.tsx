import React, { useState, useEffect } from 'react';
import { Part } from '../type';

interface PartPropertyViewProps {
  selectedPart: Part | null;
  onUpdatePart: (updatedPart: Part) => void;
}

const PartPropertyView: React.FC<PartPropertyViewProps> = ({
  selectedPart,
  onUpdatePart,
}) => {
  const [part, setPart] = useState<Part | null>(selectedPart);

  useEffect(() => {
    setPart(selectedPart);
  }, [selectedPart]);

  const handlePropertyChange = (key: keyof Part, value: string) => {
    if (part) {
      const updatedPart = { ...part, [key]: value };
      setPart(updatedPart);
      onUpdatePart(updatedPart);
    }
  };

  if (!part) {
    return <div>コンポーネントを選択してください</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">プロパティビュー</h2>
      <div>
        <label className="block mb-1">名前</label>
        <input
          type="text"
          value={part.name}
          onChange={(e) => handlePropertyChange('name', e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      {/* 他のプロパティもここに追加できます */}
    </div>
  );
};

export default PartPropertyView;
