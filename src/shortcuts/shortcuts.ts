import { comboSig, eventCombo, parseCombo } from '../utils/keys';
import type { ParsedCombo } from '../utils/keys';

export interface ShortcutOptions {
  /** Scope name this binding belongs to — only fires when scope is active */
  scope?: string;
  /** Prevent default browser behaviour when matched (default: true) */
  preventDefault?: boolean;
  /** Fire even when typing in input/textarea/contenteditable (default: false) */
  allowInInput?: boolean;
  /** Fire on keyup instead of keydown */
  onKeyup?: boolean;
}

export interface ShortcutBinding {
  combo: ParsedCombo;
  sig: string;
  handler: (e: KeyboardEvent) => void;
  opts: Required<Omit<ShortcutOptions, 'scope'>> & { scope: string };
}

export interface ShortcutMatch {
  binding: ShortcutBinding;
}

const DEFAULT_OPTS: Required<Omit<ShortcutOptions, 'scope'>> & { scope: string } = {
  scope: 'global',
  preventDefault: true,
  allowInInput: false,
  onKeyup: false,
};

export class Shortcuts {
  private _bindings = new Map<string, Set<ShortcutBinding>>();

  add(combo: string, handler: (e: KeyboardEvent) => void, opts?: ShortcutOptions): () => void {
    const parsed = parseCombo(combo);
    const sig = comboSig(parsed);
    const binding: ShortcutBinding = {
      combo: parsed,
      sig,
      handler,
      opts: { ...DEFAULT_OPTS, ...opts, scope: opts?.scope ?? 'global' },
    };
    let set = this._bindings.get(sig);
    if (!set) {
      set = new Set();
      this._bindings.set(sig, set);
    }
    set.add(binding);
    return () => this.remove(binding);
  }

  remove(binding: ShortcutBinding): void {
    const set = this._bindings.get(binding.sig);
    if (!set) return;
    set.delete(binding);
    if (set.size === 0) this._bindings.delete(binding.sig);
  }

  removeByCombo(combo: string): void {
    const sig = comboSig(parseCombo(combo));
    this._bindings.delete(sig);
  }

  clear(): void {
    this._bindings.clear();
  }

  /** Find all matching bindings for a key event — caller filters by scope. */
  match(ev: KeyboardEvent, type: 'keydown' | 'keyup'): ShortcutBinding[] {
    const combo = eventCombo(ev);
    if (!combo.key) return [];
    const sig = comboSig(combo);
    const set = this._bindings.get(sig);
    if (!set) return [];
    const out: ShortcutBinding[] = [];
    for (const b of set) {
      if (type === 'keyup' && !b.opts.onKeyup) continue;
      if (type === 'keydown' && b.opts.onKeyup) continue;
      out.push(b);
    }
    return out;
  }

  list(): ShortcutBinding[] {
    const out: ShortcutBinding[] = [];
    for (const set of this._bindings.values()) {
      for (const b of set) out.push(b);
    }
    return out;
  }
}
