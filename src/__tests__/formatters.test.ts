import { formatMoney, formatBigNumber } from '../utils/formatters';

describe('formatters', () => {
  describe('formatMoney', () => {
    it('formats positive numbers correctly', () => {
      expect(formatMoney(1234.567, '$')).toBe('$1234.57');
    });

    it('formats whole numbers with decimals', () => {
      expect(formatMoney(10, '€')).toBe('€10.00');
    });
  });

  describe('formatBigNumber', () => {
    it('formats trillions (T)', () => {
      expect(formatBigNumber(1_500_000_000_000, '$')).toBe('$1.50T');
    });

    it('formats billions (B)', () => {
      expect(formatBigNumber(2_000_000_000, '€')).toBe('€2.00B');
    });

    it('formats millions (M)', () => {
      expect(formatBigNumber(1_250_000, '$')).toBe('$1.25M');
    });

    it('formats thousands (K)', () => {
      expect(formatBigNumber(50_000, '$')).toBe('$50.00K');
    });

    it('formats numbers less than 1000', () => {
      expect(formatBigNumber(999, '$')).toBe('$999');
    });

    it('handles invalid numbers gracefully', () => {
      expect(formatBigNumber(NaN, '$')).toBe('—');
      expect(formatBigNumber(Infinity, '$')).toBe('—');
    });
  });
});
