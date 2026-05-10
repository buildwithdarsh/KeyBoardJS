import { comboSig, eventCombo, parseCombo } from '../utils/keys';

export interface SequenceOptions {
  scope?: string;
  /** Reset timeout in ms between keys (default: 1000) */
  timeout?: number;
}

export interface SequenceBinding {
  sigs: string[];
  handler: () => void;
  opts: Required<SequenceOptions>;
}

const DEFAULT_OPTS: Required<SequenceOptions> = {
  scope: 'global',
  timeout: 1000,
};

/**
 * Detects ordered key sequences like `g g` or `ctrl+k ctrl+s`.
 * Each token in the input array represents one step of the sequence.
 */
export class Sequences {
  private _bindings = new Set<SequenceBinding>();
  private _buffer: { sig: string; at: number }[] = [];

  add(sequence: string[], handler: () => void, opts?: SequenceOptions): () => void {
    const sigs = sequence.map((s) => comboSig(parseCombo(s)));
    const binding: SequenceBinding = {
      sigs,
      handler,
      opts: { ...DEFAULT_OPTS, ...opts },
    };
    this._bindings.add(binding);
    return () => { this._bindings.delete(binding); };
  }

  clear(): void {
    this._bindings.clear();
    this._buffer = [];
  }

  /** Feed a key event — returns list of sequences that fired. */
  feed(ev: KeyboardEvent, activeScope: string): SequenceBinding[] {
    const combo = eventCombo(ev);
    if (!combo.key) return [];
    const sig = comboSig(combo);
    const now = Date.now();

    // Prune expired entries from buffer (using the shortest timeout among bindings)
    const minTimeout = this._minTimeout();
    this._buffer = this._buffer.filter((entry) => now - entry.at <= minTimeout);

    this._buffer.push({ sig, at: now });

    const fired: SequenceBinding[] = [];
    for (const b of this._bindings) {
      if (b.opts.scope !== activeScope && b.opts.scope !== 'global') continue;
      if (this._buffer.length < b.sigs.length) continue;
      const tail = this._buffer.slice(-b.sigs.length);
      const within = now - (tail[0]?.at ?? 0) <= b.opts.timeout;
      if (!within) continue;
      const matches = tail.every((entry, i) => entry.sig === b.sigs[i]);
      if (matches) fired.push(b);
    }

    if (fired.length > 0) this._buffer = [];
    return fired;
  }

  private _minTimeout(): number {
    let min = Infinity;
    for (const b of this._bindings) {
      if (b.opts.timeout < min) min = b.opts.timeout;
    }
    return min === Infinity ? 1000 : min;
  }
}
