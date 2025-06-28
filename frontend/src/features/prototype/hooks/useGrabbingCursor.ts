import type { KonvaEventObject } from 'konva/lib/Node';
import { useState } from 'react';

export function useGrabbingCursor() {
  const [isGrabbing, setIsGrabbing] = useState(false);
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0) setIsGrabbing(true);
  };
  const handleMouseUp = () => setIsGrabbing(false);
  const handleMouseLeave = () => setIsGrabbing(false);
  return {
    isGrabbing,
    eventHandlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
