import type React from 'react';
import { ReactNode } from 'react';

type Props = {
  // ボタンのテキスト
  text: string;
  // ボタンのアイコン
  icon: ReactNode;
  // ボタンが無効化されているか
  disabled?: boolean;
  // ボタンをクリックしたときの処理
  onClick?: () => void;
  // ボタンのタイトル（ツールチップ）
  title?: string;
};

/** コンポーネント: パーツのプロパティメニュー用ボタン。title でネイティブツールチップを表示する。 */
const PartPropertyMenuButton = ({
  text,
  icon,
  disabled = false,
  onClick,
  title,
}: Props): React.ReactElement => {
  return (
    <button
      className="flex items-center justify-center gap-2 rounded px-2 py-1 text-xs text-kibako-white bg-kibako-primary/30 hover:bg-kibako-primary"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      {text}
    </button>
  );
};

export default PartPropertyMenuButton;
