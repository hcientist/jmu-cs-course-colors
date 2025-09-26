/*
  Color contrast helper functions (WCAG 2.0)
  - Accepts 3-digit or 6-digit hex, with or without leading '#'
  - Returns contrast ratio (number >= 1) and pass/fail for WCAG thresholds
*/


// Normalize hex string: remove #, expand 3-digit to 6-digit, validate
function normalizeHex(hex) {
  if (typeof hex !== 'string') return null;
  hex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  return hex.toLowerCase();
}

// Convert normalized 6-digit hex to [r,g,b] each 0..255
function hexToRgb(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return [r, g, b];
}

// Convert 0..255 channel to sRGB 0..1, then to linearized channel value per WCAG
function srgbChannelToLinear(c255) {
  const c = c255 / 255;
  // step-by-step exact branching to avoid tiny mistakes:
  if (c <= 0.03928) {
    return c / 12.92;
  } else {
    return Math.pow((c + 0.055) / 1.055, 2.4);
  }
}

// Relative luminance from [r,g,b] 0..255
function relativeLuminance(rgb) {
  if (!rgb) return null;
  const [r, g, b] = rgb;
  const R = srgbChannelToLinear(r);
  const G = srgbChannelToLinear(g);
  const B = srgbChannelToLinear(b);
  // coefficients are standardized: 0.2126, 0.7152, 0.0722
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Contrast ratio L1/L2 where L1 >= L2
function contrastRatio(hexA, hexB) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return null;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const L1 = Math.max(lumA, lumB);
  const L2 = Math.min(lumA, lumB);
  const ratio = (L1 + 0.05) / (L2 + 0.05);
  return {
    ratio: Number(ratio.toFixed(2)),
    lumA: Number(lumA.toFixed(4)),
    lumB: Number(lumB.toFixed(4)),
    lighterIs: (lumA >= lumB) ? 'foreground' : 'background'
  };
}

// WCAG pass checks
function wcagResults(hexFg, hexBg) {
  const c = contrastRatio(hexFg, hexBg);
  if (!c) return null;
  const r = c.ratio;
  return {
    ratio: r,
    passes: {
      AA_normal: r > 4.5,
      AA_large: r >= 3.0,
      AAA_normal: r >= 7.0,
      AAA_large: r > 4.5
    },
    lum: { fg: c.lumA, bg: c.lumB, lighterIs: c.lighterIs }
  };
}

export {
  wcagResults
};