import { formatCurrency as formatConvertedCurrency } from './currency';

export function parseBigBlind(stakes) {
  if (!stakes) return null;

  const amounts = String(stakes)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((amount) => Number.isFinite(amount));

  return amounts?.length >= 2 ? amounts[1] : amounts?.[0] ?? null;
}

export function getSessionBigBlind(session = {}) {
  const tableBigBlind = Number(session.table?.bigBlind || session.bigBlind);

  if (tableBigBlind > 0) {
    return tableBigBlind;
  }

  return parseBigBlind(session.stakes);
}

export function getSessionBbWon(session) {
  const profit = Number(session.profit) || 0;
  const bigBlind = parseBigBlind(session.stakes);

  if (bigBlind > 0) {
    return profit / bigBlind;
  }

  const hands = Number(session.hands) || 0;
  const bb100 = Number(session.bb100);

  return hands > 0 && Number.isFinite(bb100) ? (bb100 * hands) / 100 : null;
}

export function formatCurrency(value, currency = 'USD') {
  return formatConvertedCurrency(value, currency);
}

export function formatSigned(value, digits) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}
