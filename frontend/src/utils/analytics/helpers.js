export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function getStatValue(value) {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function getByPosition(stats = {}) {
  const byPosition = stats.byPosition || {};
  return byPosition instanceof Map ? Object.fromEntries(byPosition) : byPosition;
}
