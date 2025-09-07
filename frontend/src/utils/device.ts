import * as UAParser from 'ua-parser-js';

/**
 * Determine if the current device should be treated as a PC (desktop).
 * Combines UAParser detection with iPadOS 13+ and generic mobile UA heuristics.
 *
 * @param ua - User agent string
 * @param opts - Optional platform and touch info for better accuracy
 */
export function isPCFromUA(
  ua: string,
  opts?: { platform?: string; maxTouchPoints?: number }
): boolean {
  const parser = new UAParser.UAParser(ua);
  const result = parser.getResult();
  const deviceType = result.device.type; // 'mobile' | 'tablet' | 'console' | 'smarttv' | 'wearable' | 'embedded' | 'desktop' | undefined

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

  // UAParser: if specific non-desktop device type is detected, treat as non-PC
  if (deviceType && deviceType !== 'desktop') {
    return false;
  }

  // Default to PC
  return true;
}

/**
 * Convenience wrapper using the global navigator if available.
 * Returns null when not runnable (e.g., during SSR).
 */
export function isPCFromNavigator(): boolean | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform;
  const maxTouchPoints = (navigator as any).maxTouchPoints as
    | number
    | undefined;
  return isPCFromUA(ua, { platform, maxTouchPoints });
}

