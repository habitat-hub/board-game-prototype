import { renderHook } from '@testing-library/react';

import { Part } from '@/api/types';
import { useGameCamera } from '@/features/prototype/hooks/useGameCamera';

describe('useGameCamera', () => {
  test('initial camera centers on most recently created part', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
    });

    const parts: Part[] = [
      {
        id: 1,
        type: 'token',
        prototypeId: 'p',
        position: { x: 100, y: 100 },
        width: 100,
        height: 100,
        order: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        type: 'token',
        prototypeId: 'p',
        position: { x: 1950, y: 1950 },
        width: 100,
        height: 100,
        order: 1,
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
      },
    ];

    const { result } = renderHook(() =>
      useGameCamera({ parts, stageRef: { current: null } })
    );

    const { camera, viewportSize } = result.current;
    const viewportCenterX =
      (camera.x + viewportSize.width / 2) / camera.scale;
    const viewportCenterY =
      (camera.y + viewportSize.height / 2) / camera.scale;
    const latest = parts[1];
    const expectedCenterX = latest.position.x + latest.width / 2;
    const expectedCenterY = latest.position.y + latest.height / 2;

    expect(viewportCenterX).toBeCloseTo(expectedCenterX);
    expect(viewportCenterY).toBeCloseTo(expectedCenterY);
  });
});
