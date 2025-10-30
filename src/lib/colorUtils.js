
const ALPHA_B3 = 'b3';
const ALPHA_43 = '43';

// call this with a hex string (e.g. '#017474') or null to restore defaults
export function applyColors(mainHex) {
  const root = document.documentElement.style;

  if (!mainHex) {
    // Remove overrides so stylesheet default variables remain active
    root.removeProperty('--main');
    root.removeProperty('--main-t');
    root.removeProperty('--main-t2');
    // If you want to explicitly set them to defaults instead of removing:
    // root.setProperty('--blue', DEFAULTS.blue);
    // root.setProperty('--blue-t', DEFAULTS.blueT);
    // root.setProperty('--blue-t2', DEFAULTS.blueT2);
    return;
  }

  // Compute a darker base
  const darkBase = darkenHex(mainHex, 10) || mainHex; // 10% darker fallback to original

  // Create 8-digit hex with alpha suffixes 'b3' and '43'
  const mainT = hexWithAlpha(darkBase, ALPHA_B3);
  const mainT2 = hexWithAlpha(darkBase, ALPHA_43);

  // Apply to :root
  root.setProperty('--main', mainHex);
  root.setProperty('--main-t', mainT);
  root.setProperty('--main-t2', mainT2);
}


function normalizeHex(hex) {
  if (!hex) return null;
  hex = hex.trim().replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(ch => ch + ch).join('');
  }
  if (hex.length !== 6) return null;
  return hex.toLowerCase();
}

export function hexToRgb(hex) {
  const n = normalizeHex(hex);
  if (!n) return null;
  const r = parseInt(n.slice(0,2), 16);
  const g = parseInt(n.slice(2,4), 16);
  const b = parseInt(n.slice(4,6), 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }) {
  const toHex = v => {
    const s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return s.length === 1 ? '0' + s : s;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

// Darken by percent (0-100). percent=10 => reduce brightness by 10%
export function darkenHex(hex, percent = 10) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const factor = (100 - percent) / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return rgbToHex({ r, g, b });
}

// Append alpha suffix to a 6-digit hex producing 8-digit hex (#RRGGBBAA)
export function hexWithAlpha(hex, alphaSuffix) {
  const n = normalizeHex(hex);
  if (!n) return null;
  // alphaSuffix should be two hex characters (e.g. 'b3' or '43')
  return `#${n}${alphaSuffix}`.toLowerCase();
}
