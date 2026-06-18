import { describe, it, expect } from 'vitest';
import { rgbToHex, hexToRgb, hexToRgbaStr } from './color';

describe('rgbToHex', () => {
  it('converts pure white', () => {
    expect(rgbToHex(1, 1, 1)).toBe('#ffffff');
  });

  it('converts pure black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts a known color', () => {
    // 255, 0, 127 = #ff007f
    expect(rgbToHex(1, 0, 0.498)).toBe('#ff007f');
  });

  it('pads single-digit hex values', () => {
    // 0/255 = 0 → "00"
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('rounds fractional values', () => {
    // 0.5 * 255 = 127.5 → 128 → "80"
    expect(rgbToHex(0.5, 0.5, 0.5)).toBe('#808080');
  });
});

describe('hexToRgb', () => {
  it('converts #ffffff to [1, 1, 1]', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1]);
  });

  it('converts #000000 to [0, 0, 0]', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('converts #ff007f to [1, 0, ~0.498]', () => {
    const result = hexToRgb('#ff007f');
    expect(result[0]).toBeCloseTo(1.0);
    expect(result[1]).toBe(0);
    expect(result[2]).toBeCloseTo(0.498);
  });

  it('handles hex without # prefix', () => {
    const result = hexToRgb('ffffff');
    expect(result).toEqual([1, 1, 1]);
  });

  it('returns fallback for invalid hex', () => {
    expect(hexToRgb('not-a-color')).toEqual([1, 0, 1]);
  });
});

describe('hexToRgbaStr', () => {
  it('converts with full opacity', () => {
    expect(hexToRgbaStr('#ffffff', 1.0)).toBe('rgba(255, 255, 255, 1)');
  });

  it('converts with zero opacity', () => {
    expect(hexToRgbaStr('#000000', 0)).toBe('rgba(0, 0, 0, 0)');
  });

  it('converts with partial opacity', () => {
    expect(hexToRgbaStr('#9d4edd', 0.25)).toBe('rgba(157, 78, 221, 0.25)');
  });

  it('returns fallback for invalid hex', () => {
    expect(hexToRgbaStr('invalid', 0.5)).toBe('rgba(20, 16, 32, 0.5)');
  });
});
