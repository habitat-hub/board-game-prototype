import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';
import { describe, it, vi, beforeEach } from 'vitest';

import type { Part, PartProperty } from '@/__generated__/api/client';
import { GameBoardMode } from '@/features/prototype/types';

const createPassthroughComponent = (component: keyof JSX.IntrinsicElements) => {
  const MockComponent = ({
    children,
    ...rest
  }: { children?: ReactNode } & Record<string, unknown>) =>
    React.createElement(component, rest, children as ReactNode);
  MockComponent.displayName = `Mock${component}`;
  return MockComponent;
};

vi.mock('react-konva', () => ({
  Stage: createPassthroughComponent('div'),
  Layer: createPassthroughComponent('div'),
  Group: createPassthroughComponent('div'),
  Rect: createPassthroughComponent('div'),
  Text: createPassthroughComponent('span'),
  Image: createPassthroughComponent('img'),
  Line: createPassthroughComponent('div'),
  Path: createPassthroughComponent('div'),
}));
vi.mock('konva', () => ({
  __esModule: true,
  default: {
    Stage: class {},
    Node: class {
      isDragging() {
        return false;
      }
      stopDrag() {}
      getStage() {
        return null;
      }
    },
    Animation: class {
      constructor(_: unknown, __?: unknown) {}
      start() {}
      stop() {}
    },
  },
}));
vi.mock('@/features/prototype/components/molecules/LeftSidebar', () => {
  const LeftSidebarMock = () =>
    React.createElement('aside', { 'data-testid': 'left-sidebar' });
  LeftSidebarMock.displayName = 'LeftSidebarMock';
  return {
    __esModule: true,
    default: LeftSidebarMock,
  };
});
vi.mock('@/features/prototype/components/molecules/PlaySidebar', () => {
  const PlaySidebarMock = ({ canInteract }: { canInteract: boolean }) =>
    React.createElement(
      'div',
      { 'data-testid': 'play-sidebar' },
      canInteract ? 'プレイルーム設定' : null
    );
  PlaySidebarMock.displayName = 'PlaySidebarMock';
  return {
    __esModule: true,
    default: PlaySidebarMock,
  };
});
vi.mock('@/features/prototype/components/molecules/RightTopMenu', () => {
  const RightTopMenuMock = () =>
    React.createElement('div', { 'data-testid': 'right-top-menu' });
  RightTopMenuMock.displayName = 'RightTopMenuMock';
  return {
    __esModule: true,
    default: RightTopMenuMock,
  };
});
vi.mock('./GameBoardCanvas', () => {
  const GameBoardCanvasMock = () =>
    React.createElement('div', { 'data-testid': 'gameboard-canvas' });
  GameBoardCanvasMock.displayName = 'GameBoardCanvasMock';
  return {
    __esModule: true,
    default: GameBoardCanvasMock,
  };
});

vi.mock('@/api/hooks/useImages', () => ({
  useImages: () => ({
    fetchImage: vi.fn(),
    deleteImage: vi.fn(),
  }),
}));
vi.mock('@/features/prototype/hooks/usePartReducer', () => ({
  usePartReducer: () => ({ dispatch: vi.fn() }),
}));
vi.mock('@/features/prototype/hooks/usePerformanceTracker', () => ({
  usePerformanceTracker: () => ({
    measureOperation: (_: string, cb: () => void) => cb(),
  }),
}));
vi.mock('@/features/prototype/hooks/useGrabbingCursor', () => ({
  useGrabbingCursor: () => ({
    isGrabbing: false,
    eventHandlers: {
      onMouseDown: vi.fn(),
      onMouseUp: vi.fn(),
      onMouseLeave: vi.fn(),
    },
  }),
}));
vi.mock('@/features/prototype/hooks/useHandVisibility', () => ({
  useHandVisibility: () => ({ cardVisibilityMap: new Map<number, boolean>() }),
}));
vi.mock('@/features/prototype/hooks/usePartContextMenu', () => ({
  usePartContextMenu: () => ({
    showContextMenu: false,
    menuPosition: { x: 0, y: 0 },
    contextMenuPartId: null,
    handlePartContextMenu: vi.fn(),
    handleCloseContextMenu: vi.fn(),
    handleStageClickFromHook: vi.fn(),
    getContextMenuItems: vi.fn(() => []),
  }),
}));
vi.mock('@/features/prototype/hooks/usePartDragSystem', () => ({
  usePartDragSystem: () => ({
    handlePartDragStart: vi.fn(),
    handlePartDragMove: vi.fn(),
    handlePartDragEnd: vi.fn(),
  }),
}));
vi.mock('@/features/prototype/hooks/useGameCamera', () => ({
  useGameCamera: () => ({
    canvasSize: { width: 1000, height: 1000 },
    viewportSize: { width: 800, height: 600 },
    camera: { x: 0, y: 0, scale: 1 },
    handleWheel: vi.fn(),
    handleDragMove: vi.fn(),
    handleZoomIn: vi.fn(),
    handleZoomOut: vi.fn(),
    canZoomIn: true,
    canZoomOut: true,
  }),
}));
vi.mock('@/features/prototype/hooks/useSelection', () => ({
  useSelection: () => ({
    isSelectionMode: true,
    rectForSelection: { x: 0, y: 0, width: 0, height: 0, visible: false },
    handleSelectionStart: vi.fn(),
    handleSelectionMove: vi.fn(),
    handleSelectionEnd: vi.fn(),
    toggleMode: vi.fn(),
    isSelectionInProgress: false,
    isJustFinishedSelection: false,
    consumeJustFinishedSelection: () => false,
    setSelectionMode: vi.fn(),
  }),
}));
vi.mock('@/features/prototype/hooks/useGameBoardShortcut', () => ({
  useGameBoardShortcuts: vi.fn(),
}));
vi.mock('@/features/prototype/contexts/SelectedPartsContext', () => ({
  useSelectedParts: () => ({
    selectedPartIds: [],
    selectPart: vi.fn(),
    selectMultipleParts: vi.fn(),
    clearSelection: vi.fn(),
    togglePartSelection: vi.fn(),
  }),
}));

const { mockUseRoleManagement } = vi.hoisted(() => ({
  mockUseRoleManagement: vi.fn(),
}));
vi.mock('@/features/role/hooks/useRoleManagement', () => ({
  useRoleManagement: mockUseRoleManagement,
}));

import GameBoard from './GameBoard';

const basePart = {
  id: 1,
  type: 'card',
  position: { x: 0, y: 0 },
  width: 100,
  height: 150,
  order: 1,
  frontSide: 'front',
  prototypeId: 'proto-1',
  ownerId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
} as const;

describe('GameBoard permissions', () => {
  beforeEach(() => {
    mockUseRoleManagement.mockReturnValue({
      userRoles: [
        {
          userId: 'user-1',
          user: { id: 'user-1', username: 'Player' },
          roles: [{ name: 'player', description: 'player' }],
        },
      ],
      rolesReady: true,
    });
  });

  it('renders play controls but hides edit menus for player role', () => {
    const partsMap = new Map<number, typeof basePart>([
      [basePart.id, basePart],
    ]);
    const propertiesMap = new Map<number, PartProperty[]>([
      [basePart.id, [] as PartProperty[]],
    ]);

    render(
      <GameBoard
        prototypeName="Instance"
        prototypeId="proto-1"
        projectId="proj-1"
        partsMap={partsMap as unknown as Map<number, Part>}
        propertiesMap={propertiesMap}
        gameBoardMode={GameBoardMode.PLAY}
        connectedUsers={[]}
        selectedUsersByPart={{}}
        currentUserId="user-1"
      />
    );

    expect(screen.getByText('プレイルーム設定')).toBeInTheDocument();
    expect(screen.queryByText('パーツ作成メニュー')).not.toBeInTheDocument();
  });
});
