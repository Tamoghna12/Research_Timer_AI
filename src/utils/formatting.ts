/**
 * Format total minutes to HH:MM format
 * @param totalMinutes - Total minutes as number
 * @returns Formatted string like "2:45" or "0:05"
 */
export function formatMinutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format number as percentage with 0 decimal places
 * @param n - Number between 0-100
 * @returns Formatted string like "85%"
 */
export function toPercent(n: number): string {
  return `${Math.round(n)}%`;
}

/**
 * Format large numbers with appropriate suffixes
 * @param n - Number to format
 * @returns Formatted string like "1.2k" or "45"
 */
export function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return n.toString();
}

/**
 * Format minutes with appropriate unit
 * @param minutes - Minutes as number
 * @returns Formatted string like "45min" or "2h 15min"
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}