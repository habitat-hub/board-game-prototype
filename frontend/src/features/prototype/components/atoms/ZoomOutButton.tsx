import { AiOutlineZoomOut } from 'react-icons/ai';

import IconButton from '@/components/atoms/IconButton';

export default function ZoomOutButton({
  onClick,
  size = 22,
  color = '#888888',
  disabled = false,
}: {
  // ボタンをクリックしたときの処理
  onClick: () => void;
  // ボタンのサイズ
  size?: number;
  // ボタンの色
  color?: string;
  // ボタンを無効化するか
  disabled?: boolean;
}) {
  return (
    <IconButton onClick={onClick} disabled={disabled} ariaLabel="縮小する">
      <AiOutlineZoomOut size={size} color={color} />
    </IconButton>
  );
}
