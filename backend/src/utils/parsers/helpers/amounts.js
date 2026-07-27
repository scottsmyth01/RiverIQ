const MONEY_CAPTURE = '([$\\u20ac\\u00a3\\u20ae]?\\s*[\\d,]+(?:\\.\\d+)?)';
export const MONEY_PATTERN = new RegExp(MONEY_CAPTURE);
export const MONEY_PATTERN_GLOBAL = new RegExp(MONEY_CAPTURE, 'g');

export function parseAmountText(value) {
  if (!value) return null;

  const normalized = String(value).replace(/[$\u20ac\u00a3\u20ae,\s]/g, '');
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
}

export function getFirstAmount(value) {
  const match = String(value || '').match(MONEY_PATTERN);
  return match ? parseAmountText(match[1]) : null;
}

export function getAllAmounts(value) {
  return [...String(value || '').matchAll(MONEY_PATTERN_GLOBAL)]
    .map((match) => parseAmountText(match[1]))
    .filter((amount) => amount !== null);
}
