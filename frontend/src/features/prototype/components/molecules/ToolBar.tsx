import ZoomInButton from '@/features/prototype/components/atoms/ZoomInButton';
import ZoomOutButton from '@/features/prototype/components/atoms/ZoomOutButton';

export default function ToolsBar({
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
  const zoomPercentage = Math.round(zoomLevel * 100);

  return (
    <div className="fixed bottom-4 left-1/2 z-[10000] flex -translate-x-1/2 items-center justify-center rounded-lg bg-gray-300 p-1">
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center justify-center">
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
          <div className="mx-2 px-2 text-sm font-medium text-gray-700 bg-white rounded-md min-w-[45px] text-center">
            {zoomPercentage}%
          </div>
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
        </div>
      </div>
    </div>
  );
}
