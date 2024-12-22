import ZoomInButton from '@/components/atoms/ZoomInButton';
import ZoomOutButton from '@/components/atoms/ZoomOutButton';
import { CanvasState } from '@/features/prototype/type';

export default function ToolsBar({
  zoomIn,
  zoomOut,
  canZoomIn,
  canZoomOut,
}: {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}) {
  return (
    <div className="fixed bottom-12 left-1/2 z-[10000] flex -translate-x-1/2 items-center justify-center rounded-lg bg-gray-300 p-1">
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center justify-center">
          <ZoomInButton onClick={zoomIn} disabled={!canZoomIn} />
          <ZoomOutButton onClick={zoomOut} disabled={!canZoomOut} />
        </div>
      </div>
    </div>
  );
}
