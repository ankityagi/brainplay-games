export interface WarmthLevel {
  label: string;
  emoji: string;
}

const LEVELS: { maxKm: number; label: string; emoji: string }[] = [
  { maxKm: 300, label: 'Nailed the neighborhood!', emoji: '🔥' },
  { maxKm: 1000, label: 'So close!', emoji: '🌶️' },
  { maxKm: 2500, label: 'Warm', emoji: '🌤️' },
  { maxKm: 5000, label: 'Getting cold', emoji: '❄️' },
  { maxKm: 9000, label: 'Cold', emoji: '🥶' },
];

export function getWarmthLevel(distanceKm: number): WarmthLevel {
  for (const level of LEVELS) {
    if (distanceKm <= level.maxKm) return level;
  }
  return { label: 'Ice cold - other side of the world', emoji: '🧊' };
}

export function formatDistanceKm(distanceKm: number): string {
  return `${Math.round(distanceKm).toLocaleString()} km`;
}
