import ZoomInButton from '@/features/prototype/components/atoms/ZoomInButton';
import ZoomOutButton from '@/features/prototype/components/atoms/ZoomOutButton';

export default function ZoomToolbar({
  zoomIn,
  zoomOut,
  canZoomIn = true,
  canZoomOut = true,
  zoomLevel = 1.0,
}: {
  // ズームイン時の処理
  zoomIn: () => void;
  // ズームアウト時の処理
  zoomOut: () => void;
  // ズームイン可能か
  canZoomIn?: boolean;
  // ズームアウト可能か
  canZoomOut?: boolean;
  // 現在の拡大率
  zoomLevel?: number;
}) {
  // 拡大率をパーセントで表示するための計算
  // zoomLevelが未定義の場合はデフォルト値1.0を使用
  const zoomValue = zoomLevel || 1.0;
  const zoomPercentage = Math.floor(zoomValue * 100);

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex items-center justify-center rounded-xl bg-white shadow-lg border border-gray-200 p-2">
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center">
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
          <div className="mx-3 px-3 py-1 text-sm font-semibold text-gray-800 bg-gray-50 rounded-lg min-w-[50px] text-center border border-gray-200">
            {`${zoomPercentage}`}%
          </div>
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
        </div>
      </div>
    </div>
  );
}
