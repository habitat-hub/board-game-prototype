type UserLike = { userId: string };

const MIN_HUE_DIFF = 30;
// 色相の全範囲（度）
const HUE_DEGREES = 360;
// デフォルトの彩度・輝度（%）
const DEFAULT_SATURATION = 70;
const DEFAULT_LIGHTNESS = 60;

const hashToHue = (str: string): number =>
  Math.abs(
    Array.from(str).reduce((hash, char) => {
      const result = char.charCodeAt(0) + ((hash << 5) - hash);
      return result | 0;
    }, 0)
  ) % HUE_DEGREES;

// 円環距離（0..360）での差分
const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b);
  return Math.min(d, HUE_DEGREES - d);
};

const findHue = (
  hue: number,
  used: ReadonlyArray<number>,
  attempts = 0
): number =>
  used.some((h) => hueDistance(h, hue) < MIN_HUE_DIFF) &&
  attempts < HUE_DEGREES / MIN_HUE_DIFF
    ? findHue((hue + MIN_HUE_DIFF) % HUE_DEGREES, used, attempts + 1)
    : hue;

export const getUserColor = (
  userId: string,
  users: ReadonlyArray<UserLike>
): string => {
  const uniqueIds = Array.from(
    new Set([...users.map((u) => u.userId), userId])
  ).sort();

  const usedHues: number[] = [];
  const colorMap = new Map<string, number>();

  uniqueIds.forEach((id) => {
    const hue = findHue(hashToHue(id), usedHues);
    usedHues.push(hue);
    colorMap.set(id, hue);
  });

  const hue = colorMap.get(userId) ?? hashToHue(userId);
  return `hsl(${hue}, ${DEFAULT_SATURATION}%, ${DEFAULT_LIGHTNESS}%)`;
};
