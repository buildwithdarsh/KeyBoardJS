/**
 * Key normalization utilities.
 * Converts between human-readable names ("ctrl+k", "enter") and the
 * underlying KeyboardEvent representation.
 */

import { MAC_KEY_SYMBOLS, MAC_SYMBOLS, MOD_MODIFIER, PC_LABELS, IS_MAC } from './platform';

const ALIAS: Record<string, string> = {
  ctrl: 'control',
  cmd: 'meta',
  command: 'meta',
  win: 'meta',
  windows: 'meta',
  super: 'meta',
  opt: 'alt',
  option: 'alt',
  return: 'enter',
  esc: 'escape',
  space: ' ',
  spacebar: ' ',
  plus: '+',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  del: 'delete',
  ins: 'insert',
  pgup: 'pageup',
  pgdn: 'pagedown',
};

const MODIFIER_ORDER = ['control', 'alt', 'shift', 'meta'] as const;
export type Modifier = (typeof MODIFIER_ORDER)[number];

export interface ParsedCombo {
  key: string;
  mods: Set<Modifier>;
}

/** Normalize a single key token to its canonical form. */
export function normKey(raw: string): string {
  const k = raw.trim().toLowerCase();
  // `mod` is the cross-platform modifier — Cmd on Mac, Ctrl elsewhere.
  // VSCode, CodeMirror, and Electron use the same convention.
  if (k === 'mod' || k === 'commandorcontrol' || k === 'cmdorctrl') {
    return MOD_MODIFIER;
  }
  return ALIAS[k] ?? k;
}

/** Parse "ctrl+shift+k" into a ParsedCombo. */
export function parseCombo(input: string): ParsedCombo {
  const parts = input
    .split('+')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) {
    return { key: '', mods: new Set() };
  }

  const mods = new Set<Modifier>();
  let key = '';

  for (const raw of parts) {
    const n = normKey(raw);
    if (MODIFIER_ORDER.includes(n as Modifier)) {
      mods.add(n as Modifier);
    } else {
      key = n;
    }
  }

  return { key, mods };
}

/** Build a comparable signature: "control+shift|k" */
export function comboSig(combo: ParsedCombo): string {
  const mods = MODIFIER_ORDER.filter((m) => combo.mods.has(m)).join('+');
  return `${mods}|${combo.key}`;
}

/** Extract a ParsedCombo from a live KeyboardEvent. */
export function eventCombo(ev: KeyboardEvent): ParsedCombo {
  const mods = new Set<Modifier>();
  if (ev.ctrlKey) mods.add('control');
  if (ev.altKey) mods.add('alt');
  if (ev.shiftKey) mods.add('shift');
  if (ev.metaKey) mods.add('meta');

  let key = ev.key.toLowerCase();
  // Strip modifier self-reports so "shift" alone doesn't clash with "shift+a"
  if (MODIFIER_ORDER.includes(key as Modifier)) key = '';

  return { key, mods };
}

/**
 * Pretty-print a combo for display.
 * Mac: uses glyphs with no separator ("⌘K").
 * PC:  uses words with " + " separator ("Ctrl + K").
 */
export function formatCombo(combo: ParsedCombo): string {
  const parts: string[] = [];
  const labels = IS_MAC ? MAC_SYMBOLS : PC_LABELS;
  for (const m of MODIFIER_ORDER) {
    if (combo.mods.has(m)) parts.push(labels[m] ?? m);
  }
  if (combo.key) {
    const special = IS_MAC ? MAC_KEY_SYMBOLS[combo.key] : undefined;
    parts.push(special ?? (combo.key.length === 1 ? combo.key.toUpperCase() : combo.key));
  }
  return parts.join(IS_MAC ? '' : ' + ');
}
