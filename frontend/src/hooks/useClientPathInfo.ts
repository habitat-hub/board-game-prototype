import { usePathname } from 'next/navigation';

const UUID_PATTERN =
  '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

/**
 * パス情報をまとめて返すカスタムフック
 * - pathname: 現在のパス
 * - isGameBoardPath: /projects/<uuid>/prototypes/<uuid> の形式（末尾スラッシュ有無も許容）
 * 今後他のパス判定もここに追加可能
 */
export function useClientPathInfo() {
  const pathname = usePathname();
  const isGameBoardPath = new RegExp(
    `^/projects/${UUID_PATTERN}/prototypes/${UUID_PATTERN}/?$`
  ).test(pathname);
  const isUnsupportedDevicePath = pathname === '/unsupported-device';

  return { pathname, isGameBoardPath, isUnsupportedDevicePath };
}
