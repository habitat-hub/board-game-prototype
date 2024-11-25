import React, { useState } from 'react';

const ComponentPropertyView: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [properties, setProperties] = useState<{ [key: string]: string }>({});

  const handlePropertyChange = (key: string, value: string) => {
    setProperties((prev) => ({ ...prev, [key]: value }));
    // WebSocketやFirebaseでリアルタイムに他のユーザーに反映
  };

  return (
    <div className="p-4 border-l">
      <h2 className="text-lg font-bold mb-2">プロパティビュー</h2>
      {selectedComponent ? (
        <div>
          <h3 className="font-bold">{selectedComponent}</h3>
          <div className="mt-2">
            <label className="block mb-1">プロパティ1</label>
            <input
              type="text"
              value={properties['property1'] || ''}
              onChange={(e) =>
                handlePropertyChange('property1', e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      ) : (
        <p>コンポーネントを選択してください</p>
      )}
    </div>
  );
};

export default ComponentPropertyView;
