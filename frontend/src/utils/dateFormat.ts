/**
 * 日付をフォーマットする
 * @param date - 日付（Date型または日付文字列）
 * @param withTime - 時間を含めるかどうか
 * @returns フォーマットされた日付文字列
 *
 * @example
 * formatDate('2021-01-01') // '2021/01/01'
 * formatDate(new Date('2021-01-01'), true) // '2021/01/01 00:00:00'
 */
export default function formatDate(
  date: string | Date | null | undefined,
  withTime = false,
  fallback: string = ''
): string {
  // Guard null/undefined/empty-string early
  if (date == null || (typeof date === 'string' && date.trim() === '')) {
    return fallback;
  }

  const d = new Date(date);

  // Validate constructed date
  if (Number.isNaN(d.getTime())) {
    return fallback;
  }

  // Use UTC to ensure stable results regardless of execution environment's timezone.
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
    ...(withTime
      ? ({
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        } as const)
      : {}),
  };

  return new Intl.DateTimeFormat('ja-JP', options).format(d);
}
