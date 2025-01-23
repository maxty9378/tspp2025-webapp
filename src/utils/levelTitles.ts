export function getLevelTitle(level: number): string {
  if (level >= 10) return 'Легенда';
  if (level >= 8) return 'Мастер';
  if (level >= 6) return 'Эксперт';
  if (level >= 4) return 'Профессионал';
  if (level >= 2) return 'Специалист';
  return 'Новичок';
}