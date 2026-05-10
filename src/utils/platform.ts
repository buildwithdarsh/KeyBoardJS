/**
 * Platform detection — runs once at module load.
 * Determines how `mod` maps to a physical modifier and how combos
 * are pretty-printed.
 */

export type Platform = 'mac' | 'windows' | 'linux' | 'other';

function detect(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const plat = (navigator.platform || '').toLowerCase();

  // Apple devices report "MacIntel", "iPhone", "iPad", "iPod".
  // On iPadOS 13+ the platform string is "MacIntel" but `maxTouchPoints > 1`.
  if (/mac|iphone|ipad|ipod/i.test(plat)) return 'mac';
  if (/mac/i.test(ua)) return 'mac';
  if (/win/i.test(plat) || /windows/i.test(ua)) return 'windows';
  if (/linux|x11/i.test(plat) || /linux/i.test(ua)) return 'linux';
  return 'other';
}

export const PLATFORM: Platform = detect();
export const IS_MAC = PLATFORM === 'mac';

/** The physical modifier that `mod` (a.k.a. "CommandOrControl") resolves to. */
export const MOD_MODIFIER: 'meta' | 'control' = IS_MAC ? 'meta' : 'control';

/** Mac glyphs for the four modifiers. */
export const MAC_SYMBOLS: Record<string, string> = {
  control: '\u2303', // ⌃
  alt: '\u2325',     // ⌥
  shift: '\u21E7',   // ⇧
  meta: '\u2318',    // ⌘
};

/** Human-readable labels for non-Mac platforms. */
export const PC_LABELS: Record<string, string> = {
  control: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Win',
};

/** Special-key glyphs on Mac ("enter" → ↵, etc.) */
export const MAC_KEY_SYMBOLS: Record<string, string> = {
  enter: '\u21B5',      // ↵
  backspace: '\u232B',  // ⌫
  delete: '\u2326',     // ⌦
  tab: '\u21E5',        // ⇥
  escape: 'esc',
  arrowup: '\u2191',
  arrowdown: '\u2193',
  arrowleft: '\u2190',
  arrowright: '\u2192',
  ' ': 'Space',
};
