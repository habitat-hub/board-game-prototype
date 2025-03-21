export default function formatDate(
  dateString: string,
  withTime = false
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  });
}
