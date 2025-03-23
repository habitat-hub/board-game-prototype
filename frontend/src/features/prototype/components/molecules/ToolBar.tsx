import ZoomInButton from '@/components/atoms/ZoomInButton';
import ZoomOutButton from '@/components/atoms/ZoomOutButton';

export default function ToolsBar({
  zoomIn,
  zoomOut,
  canZoomIn = true,
  canZoomOut = true,
}: {
  // ズームイン時の処理
  zoomIn: () => void;
  // ズームアウト時の処理
  zoomOut: () => void;
  // ズームイン可能か
  canZoomIn?: boolean;
  // ズームアウト可能か
  canZoomOut?: boolean;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[10000] flex -translate-x-1/2 items-center justify-center rounded-lg bg-gray-300 p-1">
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center justify-center">
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
        </div>
      </div>
    </div>
  );
}
