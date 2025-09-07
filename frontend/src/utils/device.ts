import { UAParser, type IResult } from 'ua-parser-js';

/**
 * デバイスをPCとして扱うべきかを判定する。
 * UAParserの結果に加え、iPadOS13+の擬装検出・モバイルUAの簡易判定を組み合わせる。
 *
 * @param ua ユーザーエージェント文字列
 * @param opts 追加情報（platform / maxTouchPoints）
 */
export function isPCFromUA(
  ua: string,
  opts?: { platform?: string; maxTouchPoints?: number }
): boolean {
  const parser = new UAParser(ua);
  const result: IResult = parser.getResult();
  const deviceType = result.device.type; // 'mobile' | 'tablet' | 'console' | 'smarttv' | 'wearable' | 'embedded' | undefined

  const platform = opts?.platform;
  const maxTouchPoints = opts?.maxTouchPoints ?? 0;

  // iPadOS 13+ may masquerade as Mac; detect via touch points
  if (platform === 'MacIntel' && maxTouchPoints > 1) {
    return false; // treat as non-PC (tablet)
  }

  // Fallback: broad mobile UA check
  const isMobileUA = /Android|iPhone|iPod|iPad|Mobile|Windows Phone/i.test(ua);
  if (isMobileUA) {
    return false;
  }

  // UAParser: if a specific device type is detected, treat as non-PC
  // (UAParser typically leaves desktop as undefined)
  if (deviceType) {
    return false;
  }

  // Default to PC
  return true;
}

/**
 * グローバルの navigator が利用可能な場合のラッパー。
 * SSR 等で判定不能な場合は null を返す。
 */
export function isPCFromNavigator(): boolean | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform;
  const maxTouchPoints =
    'maxTouchPoints' in navigator ? navigator.maxTouchPoints : undefined;
  return isPCFromUA(ua, { platform, maxTouchPoints });
}
