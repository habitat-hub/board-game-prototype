import { ChangeEvent } from 'react';

const Dropdown = ({
  value,
  onChange,
  options,
}: {
  // 選択されている値
  value: string;
  // 値が変更されたときの処理
  onChange: (value: string) => void;
  // 選択肢
  options: string[];
}) => {
  /**
   * 選択されている値が変更されたときの処理
   */
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="w-full">
      <select
        value={value}
        onChange={handleChange}
        className="w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f5] px-2 py-1 text-xs hover:bg-[#e8e8e8]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
