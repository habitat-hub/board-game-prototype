import type { ShortcutInfo } from '@/features/prototype/types/helpInfo';
import { IS_MAC } from '@/utils/os';

type ShortcutDef = {
  id: string;
  label: string;
  description: string;
  match?: (e: KeyboardEvent) => boolean;
  showInHelp: boolean;
};

const MODIFIER_KEY = IS_MAC ? 'Cmd' : 'Ctrl';

export const KEYBOARD_SHORTCUTS: Record<string, ShortcutDef> = {
  help: {
    id: 'help',
    label: 'Shift + ?',
    description: 'ヘルプパネルを開閉する。',
    match: (e: KeyboardEvent) => e.shiftKey && e.key === '?',
    showInHelp: true,
  },
  spaceDrag: {
    id: 'space-drag',
    label: 'Space + ドラッグ',
    description: '選択モード時に一時的にゲームボードを移動する。',
    showInHelp: true,
  },
  multiSelect: {
    id: 'multi-select',
    label: 'Shift + クリック',
    description: '複数のパーツを選択する。',
    showInHelp: true,
  },
  deleteParts: {
    id: 'delete',
    label: 'Delete / Backspace',
    description: '選択中のパーツを全て削除する。',
    match: (e: KeyboardEvent) =>
      (e.key === 'Delete' || e.key === 'Backspace') &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.shiftKey,
    showInHelp: true,
  },
  duplicatePart: {
    id: 'duplicate',
    label: `${MODIFIER_KEY} + D`,
    description: '選択中のパーツ1つを複製する。',
    match: (e: KeyboardEvent) =>
      (IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey) &&
      !e.altKey &&
      !e.shiftKey &&
      e.key.toLowerCase() === 'd',
    showInHelp: true,
  },
  zoomBoard: {
    id: 'zoom',
    label: `${MODIFIER_KEY} + ホイール`,
    description: 'ボードを拡大縮小する。',
    showInHelp: true,
  },
  debugToggle: {
    id: 'debug-toggle',
    label: `${MODIFIER_KEY} + I`,
    description: 'デバッグ情報の表示/非表示を切り替える。',
    match: (e: KeyboardEvent) =>
      (IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey) &&
      e.key.toLowerCase() === 'i',
    showInHelp: false,
  },
} as const;

export const SHORTCUTS: ShortcutInfo[] = Object.values(KEYBOARD_SHORTCUTS)
  .filter((s) => s.showInHelp)
  .map(({ id, label, description }) => ({ id, key: label, description }));
