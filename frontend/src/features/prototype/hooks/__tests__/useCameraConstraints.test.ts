import { renderHook } from '@testing-library/react';

import {
  CAMERA_SCALE,
  GAME_BOARD_CENTER,
} from '@/features/prototype/constants';
import { useCameraConstraints } from '@/features/prototype/hooks/useCameraConstraints';

describe('useCameraConstraints', () => {
  test('getConstrainedCameraPosition clamps position within bounds', () => {
    const { result } = renderHook(() => useCameraConstraints());

    const { getConstrainedCameraPosition, getCameraConstraints, viewportSize } =
      result.current;

    const outOfBounds = getConstrainedCameraPosition(-10000, -10000, 1);
    const { minX, minY } = getCameraConstraints(1, viewportSize);

    expect(outOfBounds.x).toBeGreaterThanOrEqual(minX);
    expect(outOfBounds.y).toBeGreaterThanOrEqual(minY);
  });

  test('computeCenteredCamera positions camera near board center', () => {
    const { result } = renderHook(() => useCameraConstraints());

    const { computeCenteredCamera, getCameraConstraints, viewportSize } =
      result.current;

    const camera = computeCenteredCamera();
    const expectedX =
      GAME_BOARD_CENTER.x * CAMERA_SCALE.DEFAULT - viewportSize.width / 2;
    const expectedY =
      GAME_BOARD_CENTER.y * CAMERA_SCALE.DEFAULT - viewportSize.height / 2;
    const { minX, maxX, minY, maxY } = getCameraConstraints(
      CAMERA_SCALE.DEFAULT,
      viewportSize
    );

    const constrainedX = Math.max(minX, Math.min(maxX, expectedX));
    const constrainedY = Math.max(minY, Math.min(maxY, expectedY));

    expect(camera.x).toBeCloseTo(constrainedX);
    expect(camera.y).toBeCloseTo(constrainedY);
  });
});
