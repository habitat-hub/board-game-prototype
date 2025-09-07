import { UAParser, type IResult } from 'ua-parser-js';

/** デバイス検出オプション */
export interface DeviceDetectOptions {
  /** window.navigator.platform の値（例: 'MacIntel'） */
  platform?: string;
  /** マルチタッチ点数（iPadOS 判定に使用） */
  maxTouchPoints?: number;
  /** タブレットをPC扱いする場合は true（既定: false） */
  treatTabletAsPC?: boolean;
}

// フォールバック用: モバイル系 UA の大まかな検出
const MOBILE_UA_REGEX = /Android|iPhone|iPod|iPad|Mobile|Windows Phone/i;

/**
 * デバイスをPCとして扱うべきかを判定する。
 * UAParserの結果に加え、iPadOS13+の擬装検出・モバイルUAの簡易判定を組み合わせる。
 *
 * @param ua ユーザーエージェント文字列
 * @param opts 追加情報（platform / maxTouchPoints）
 */
export function isPCFromUA(ua: string, opts?: DeviceDetectOptions): boolean {
  let deviceType: IResult['device']['type'];
  try {
    const parser = new UAParser(ua);
    const result: IResult = parser.getResult();
    deviceType = result.device.type; // 'mobile' | 'tablet' | 'console' | 'smarttv' | 'wearable' | 'embedded' | undefined
  } catch (e) {
    // 予期しないエラーはログに記録し、安全側（非PC扱いしない）に倒す

    console.error('デバイス判定中に予期しないエラーが発生しました', e);
    deviceType = undefined;
  }

  const platform = opts?.platform;
  const maxTouchPoints = opts?.maxTouchPoints ?? 0;

  // iPadOS 13+ may masquerade as Mac; detect via touch points
  if (platform === 'MacIntel' && maxTouchPoints > 1) {
    return false; // treat as non-PC (tablet)
  }

  // フォールバック: モバイル系 UA の大まかな検出
  const isMobileUA = MOBILE_UA_REGEX.test(ua);
  if (isMobileUA) {
    return false;
  }

  // UAParser: device.type が存在する = 非デスクトップ
  // タブレットのみ PC とみなすオプションに対応
  if (deviceType) {
    if (deviceType === 'tablet' && opts?.treatTabletAsPC) return true;
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
