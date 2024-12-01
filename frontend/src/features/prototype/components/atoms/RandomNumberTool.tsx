import React, { useState, useRef, useEffect } from 'react';

interface RandomNumberToolProps {
  onClose: () => void;
}

const RandomNumberTool: React.FC<RandomNumberToolProps> = ({ onClose }) => {
  const [minValue, setMinValue] = useState(1);
  const [maxValue, setMaxValue] = useState(10);
  const [randomResult, setRandomResult] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * 乱数を生成する
   */
  const generateRandomNumber = () => {
    if (minValue > maxValue) {
      alert('最小値は最大値以下でなければなりません。');
      return;
    }
    const result =
      Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    setRandomResult(result);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed bottom-16 right-4 bg-white p-4 rounded shadow-lg w-64"
    >
      <h3 className="text-lg font-bold mb-2">乱数生成ツール</h3>
      <div className="mb-2">
        <label className="block text-sm">最小値:</label>
        <input
          type="number"
          value={minValue}
          onChange={(e) => setMinValue(Number(e.target.value))}
          className="border p-1 w-full"
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm">最大値:</label>
        <input
          type="number"
          value={maxValue}
          onChange={(e) => setMaxValue(Number(e.target.value))}
          className="border p-1 w-full"
        />
      </div>
      <button
        onClick={generateRandomNumber}
        className="bg-green-500 text-white p-2 rounded w-full"
      >
        生成
      </button>
      {randomResult !== null && (
        <div className="mt-2 text-center">
          <span className="text-lg font-bold">結果: {randomResult}</span>
        </div>
      )}
    </div>
  );
};

export default RandomNumberTool;