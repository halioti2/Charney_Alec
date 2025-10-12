import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber } from '../formatters.js';

describe('formatters', () => {
  it('formats currency in USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(null)).toBe('$0.00');
  });

  it('formats currency with custom options', () => {
    expect(formatCurrency(1000, { minimumFractionDigits: 0, maximumFractionDigits: 0 })).toBe('$1,000');
  });

  it('formats percent from whole numbers', () => {
    expect(formatPercent(6.25)).toBe('6.25%');
  });

  it('formats percent from fraction when specified', () => {
    expect(formatPercent(0.0625, { fromFraction: true, maximumFractionDigits: 1 })).toBe('6.3%');
  });

  it('formats numbers with grouping', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});
