import { normKey } from '../utils/keys';

export interface ChordOptions {
  scope?: string;
  /** Max time between first and last key press in ms (default: 250) */
  window?: number;
}

export interface ChordBinding {
  keys: Set<string>;
  handler: () => void;
  opts: Required<ChordOptions>;
}

const DEFAULT_OPTS: Required<ChordOptions> = {
  scope: 'global',
  window: 250,
};

/**
 * Detects simultaneous key presses (e.g. "j+k" pressed together).
 * Differs from shortcuts in that it has no modifier constraint — any
 * combination of plain keys held within a short window counts.
 */
export class Chords {
  private _bindings = new Set<ChordBinding>();
  private _held = new Map<string, number>();

  add(keys: string[], handler: () => void, opts?: ChordOptions): () => void {
    const binding: ChordBinding = {
      keys: new Set(keys.map(normKey)),
      handler,
      opts: { ...DEFAULT_OPTS, ...opts },
    };
    this._bindings.add(binding);
    return () => { this._bindings.delete(binding); };
  }

  clear(): void {
    this._bindings.clear();
    this._held.clear();
  }

  down(ev: KeyboardEvent, activeScope: string): ChordBinding[] {
    const key = normKey(ev.key);
    if (!this._held.has(key)) this._held.set(key, Date.now());

    const now = Date.now();
    const fired: ChordBinding[] = [];

    for (const b of this._bindings) {
      if (b.opts.scope !== activeScope && b.opts.scope !== 'global') continue;
      if (b.keys.size !== this._held.size) continue;

      let allMatch = true;
      let earliest = now;
      for (const k of b.keys) {
        const t = this._held.get(k);
        if (t === undefined) { allMatch = false; break; }
        if (t < earliest) earliest = t;
      }
      if (!allMatch) continue;
      if (now - earliest > b.opts.window) continue;
      fired.push(b);
    }
    return fired;
  }

  up(ev: KeyboardEvent): void {
    this._held.delete(normKey(ev.key));
  }

  reset(): void {
    this._held.clear();
  }
}
