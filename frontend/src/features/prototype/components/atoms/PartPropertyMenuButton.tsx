import type { ReactElement, ReactNode } from 'react';

type Props = {
  // ボタンのテキスト
  text: string;
  // ボタンのアイコン
  icon: ReactNode;
  // スクリーンリーダー用のラベル（text を表示しない場合に推奨）
  ariaLabel?: string;
  // ホバー時のツールチップ
  title?: string;
  // ボタンが無効化されているか
  disabled?: boolean;
  // ボタンをクリックしたときの処理
  onClick?: () => void;
};

/** コンポーネント: パーツのプロパティメニュー用ボタン。title でネイティブツールチップを表示する。 */
const PartPropertyMenuButton = ({
  text,
  icon,
  ariaLabel,
  title,
  disabled = false,
  onClick,
}: Props): ReactElement => {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? undefined}
      title={title ?? undefined}
      className="flex items-center justify-center gap-2 rounded px-2 py-1 text-xs text-kibako-white bg-kibako-primary/30 hover:bg-kibako-primary"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {text}
    </button>
  );
};

export default PartPropertyMenuButton;
