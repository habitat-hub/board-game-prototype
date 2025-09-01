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
  date: string | Date,
  withTime = false
): string {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  });
}
