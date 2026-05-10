export type LayoutName = 'qwerty' | 'dvorak' | 'colemak';

/** Mapping from QWERTY physical key → Dvorak character. */
const DVORAK: Record<string, string> = {
  q: "'", w: ',', e: '.', r: 'p', t: 'y', y: 'f', u: 'g', i: 'c', o: 'r', p: 'l',
  a: 'a', s: 'o', d: 'e', f: 'u', g: 'i', h: 'd', j: 'h', k: 't', l: 'n',
  z: ';', x: 'q', c: 'j', v: 'k', b: 'x', n: 'b', m: 'm',
};

const COLEMAK: Record<string, string> = {
  q: 'q', w: 'w', e: 'f', r: 'p', t: 'g', y: 'j', u: 'l', i: 'u', o: 'y', p: ';',
  a: 'a', s: 'r', d: 's', f: 't', g: 'd', h: 'h', j: 'n', k: 'e', l: 'i',
  z: 'z', x: 'x', c: 'c', v: 'v', b: 'b', n: 'k', m: 'm',
};

/**
 * Layout remapper — translates a user's physical key press into the
 * character they *intend* to produce under a different layout.
 * Useful when letting users define shortcuts that survive layout changes.
 */
export class Layouts {
  private _active: LayoutName = 'qwerty';

  set(layout: LayoutName): void {
    this._active = layout;
  }

  get name(): LayoutName {
    return this._active;
  }

  /** Translate a key character from QWERTY-physical to the active layout. */
  translate(key: string): string {
    const k = key.toLowerCase();
    if (this._active === 'qwerty') return k;
    const map = this._active === 'dvorak' ? DVORAK : COLEMAK;
    return map[k] ?? k;
  }
}
