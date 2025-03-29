import React, { ReactNode, useState } from 'react';

type TextInputProps = {
  // 入力値
  value: string;
  // 値が変更されたときのコールバック
  onChange: (value: string) => void;
  // 入力欄の前に表示するアイコン
  icon: ReactNode;
  // 複数行入力を許可するか
  multiline?: boolean;
};

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  icon,
  multiline = false,
}) => {
  // 入力値
  const [inputValue, setInputValue] = useState(value);
  // 日本語入力の変換中か
  const [isComposing, setIsComposing] = useState(false);

  /**
   * キー押下時の処理
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // 複数行入力の場合、Enterキー以外の場合は何もしない
    if (multiline || e.key !== 'Enter') return;

    onChange(inputValue);

    // 日本語変換用のEnterキーの場合
    if (isComposing) return;
    // フォーカスを外す
    (e.currentTarget as HTMLElement).blur();
  };

  /**
   * フォーカスが外れたときの処理
   */
  const handleBlur = () => {
    onChange(inputValue);
  };

  /**
   * 日本語入力の変換開始時の処理
   */
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  /**
   * 日本語入力の変換終了時の処理
   */
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 入力コンポーネント
  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="relative h-fit w-full">
      <InputComponent
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        rows={multiline ? 3 : undefined}
        className={`h-fit w-full rounded-lg border border-[#f5f5f5] bg-[#f5f5f5] px-2 py-1 pl-6 text-xs hover:border-[#e8e8e8] ${
          multiline ? 'resize-none' : ''
        }`}
      />
      <p className="absolute left-2 top-2 text-[10px] text-gray-400">{icon}</p>
    </div>
  );
};

export default TextInput;
