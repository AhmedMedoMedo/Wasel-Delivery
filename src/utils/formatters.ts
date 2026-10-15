export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'الآن';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعة`;
  return `${Math.floor(hours / 24)} يوم`;
}

export function formatTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export function getDeliveryDurationMinutes(startDateStr: string, endDateStr?: string | null): number {
  const start = new Date(startDateStr).getTime();
  const end = endDateStr ? new Date(endDateStr).getTime() : Date.now();
  return Math.max(1, Math.floor((end - start) / 60000));
}
