import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { CAMERA_SCALE } from '@/features/prototype/constants';
import { useCameraConstraints } from '../useCameraConstraints';
import { useCameraHandlers } from '../useCameraHandlers';

describe('useCameraHandlers', () => {
  test('handleZoomIn and handleZoomOut adjust camera scale', () => {
    const { result } = renderHook(() => {
      const constraints = useCameraConstraints();
      const [camera, setCamera] = useState(constraints.computeCenteredCamera());
      const handlers = useCameraHandlers({
        camera,
        setCamera,
        stageRef: { current: null },
        viewportSize: constraints.viewportSize,
        getConstrainedCameraPosition: constraints.getConstrainedCameraPosition,
      });
      return { camera, ...handlers };
    });

    const initialScale = result.current.camera.scale;

    act(() => {
      result.current.handleZoomIn();
    });
    expect(result.current.camera.scale).toBeCloseTo(
      Math.min(initialScale * CAMERA_SCALE.STEP, CAMERA_SCALE.MAX)
    );

    act(() => {
      result.current.handleZoomOut();
    });
    expect(result.current.camera.scale).toBeCloseTo(initialScale);
  });
});
