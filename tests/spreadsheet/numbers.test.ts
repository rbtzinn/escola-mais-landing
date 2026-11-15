import { describe, expect, it } from 'vitest';
import { formatNumber, parseNumber } from '@/lib/spreadsheet/numbers';

describe('parseNumber', () => {
  it('aceita formatos brasileiros e internacionais', () => {
    expect(parseNumber('7,5')).toBe(7.5);
    expect(parseNumber('7.5')).toBe(7.5);
    expect(parseNumber(' 92,4% ')).toBe(92.4);
    expect(parseNumber('1.234,5')).toBe(1234.5);
    expect(parseNumber('10')).toBe(10);
  });

  it('retorna null para vazio e texto', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('7a')).toBeNull();
  });
});

describe('formatNumber', () => {
  it('usa vírgula decimal', () => {
    expect(formatNumber(4.5)).toBe('4,5');
    expect(formatNumber(70, 0)).toBe('70');
  });
});
