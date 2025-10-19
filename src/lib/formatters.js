const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value, options = {}) {
  const { currency = 'USD', minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;
  const numeric = Number.isFinite(value) ? value : 0;
  if (currency === 'USD' && minimumFractionDigits === 2 && maximumFractionDigits === 2) {
    return CURRENCY_FORMATTER.format(numeric);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numeric);
}

export function formatPercent(value, options = {}) {
  const {
    fromFraction = false,
    minimumFractionDigits: minOpt,
    maximumFractionDigits: maxOpt,
  } = options;

  const maximumFractionDigits = Number.isInteger(maxOpt) && maxOpt >= 0 ? maxOpt : 2;
  let minimumFractionDigits;

  if (Number.isInteger(minOpt) && minOpt >= 0) {
    minimumFractionDigits = minOpt;
  } else {
    minimumFractionDigits = Math.min(2, maximumFractionDigits);
  }

  if (minimumFractionDigits > maximumFractionDigits) {
    minimumFractionDigits = maximumFractionDigits;
  }

  const numeric = Number.isFinite(value) ? value : 0;
  const ratio = fromFraction ? numeric : numeric / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(ratio);
}

export function formatNumber(value, options = {}) {
  const numeric = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', options).format(numeric);
}

export function formatCurrencyAbbreviated(value) {
  const numeric = Number.isFinite(value) ? value : 0;

  if (numeric >= 1000000) {
    return `$${(numeric / 1000000).toFixed(1)}M`;
  }
  if (numeric >= 1000) {
    return `$${(numeric / 1000).toFixed(0)}K`;
  }
  return `$${numeric.toFixed(0)}`;
}

export function formatNumberAbbreviated(value) {
  const numeric = Number.isFinite(value) ? value : 0;
  return Math.round(numeric).toString();
}
