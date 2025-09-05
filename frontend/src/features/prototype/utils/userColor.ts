type UserLike = { userId: string };

const MIN_HUE_DIFF = 30;

const hashToHue = (str: string): number =>
  Math.abs(
    Array.from(str).reduce((hash, char) => {
      const result = char.charCodeAt(0) + ((hash << 5) - hash);
      return result | 0;
    }, 0)
  ) % 360;

const findHue = (
  hue: number,
  used: ReadonlyArray<number>,
  attempts = 0
): number =>
  used.some((h) => Math.abs(h - hue) < MIN_HUE_DIFF) &&
  attempts < 360 / MIN_HUE_DIFF
    ? findHue((hue + MIN_HUE_DIFF) % 360, used, attempts + 1)
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
  return `hsl(${hue}, 70%, 60%)`;
};
