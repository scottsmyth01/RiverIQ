const DEFAULT_CURRENCY = 'USD';

const currencyRatesFromUsd = {
  USD: 1,
  CAD: 1.38,
  GBP: 0.75,
  JPY: 147,
  CNY: 7.18,
};

const currencySymbols = {
  USD: '$',
  CAD: 'C$',
  GBP: '£',
  JPY: '¥',
  CNY: 'CN¥',
  USDT: '₮',
};

export function getPreferredCurrency(user) {
  return user?.preferences?.currency || DEFAULT_CURRENCY;
}

export function getCurrencySymbol(currency = DEFAULT_CURRENCY) {
  return currencySymbols[currency] || currency || '';
}

export function convertFromUsd(value, currency = DEFAULT_CURRENCY) {
  const number = Number(value);
  const rate = currencyRatesFromUsd[currency] || currencyRatesFromUsd[DEFAULT_CURRENCY];

  return Number.isFinite(number) ? number * rate : null;
}

export function formatCurrency(value, currency = DEFAULT_CURRENCY, options = {}) {
  const convertedValue = options.convert === false ? Number(value) : convertFromUsd(value, currency);

  if (!Number.isFinite(convertedValue)) return 'N/A';

  const decimals = currency === 'JPY' ? 0 : 2;
  const sign = convertedValue < 0 ? '-' : options.showPositiveSign && convertedValue > 0 ? '+' : '';

  return `${sign}${getCurrencySymbol(currency)}${Math.abs(convertedValue).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatSignedCurrency(value, currency = DEFAULT_CURRENCY) {
  return formatCurrency(value, currency, { showPositiveSign: true });
}

export function formatStakes(stakes, currency = DEFAULT_CURRENCY) {
  if (!stakes) return 'N/A';

  const amounts = String(stakes).match(/\d+(?:\.\d+)?/g);
  if (!amounts || amounts.length < 2) return stakes;

  const decimals = currency === 'JPY' ? 0 : 2;
  const symbol = getCurrencySymbol(currency);
  const convertedAmounts = amounts.map((amount) => {
    const converted = convertFromUsd(amount, currency);

    if (!Number.isFinite(converted)) return amount;
    return converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  const normalizedStakes = `${symbol}${convertedAmounts[0]}/${symbol}${convertedAmounts[1]}`;
  return convertedAmounts[2] ? `${normalizedStakes} (${symbol}${convertedAmounts[2]})` : normalizedStakes;
}
