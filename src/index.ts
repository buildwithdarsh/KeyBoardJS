import { KbEvents } from './events/events';
import { Shortcuts } from './shortcuts/shortcuts';
import type { ShortcutOptions } from './shortcuts/shortcuts';
import { Sequences } from './sequences/sequences';
import type { SequenceOptions } from './sequences/sequences';
import { Chords } from './chords/chords';
import type { ChordOptions } from './chords/chords';
import { Layouts } from './layouts/layouts';
import type { LayoutName } from './layouts/layouts';
import { Scope } from './scope/scope';
import { Recorder } from './recorder/recorder';
import type { RecordedKey } from './recorder/recorder';
import { formatCombo, parseCombo } from './utils/keys';
import { PLATFORM, IS_MAC, MOD_MODIFIER } from './utils/platform';
import type { Platform } from './utils/platform';

export interface InitOptions {
  /** EventTarget to attach listeners to (default: window) */
  target?: EventTarget;
  /** Default scope name when starting (default: "global") */
  scope?: string;
}

class Keyboard {
  private _ev = new KbEvents();
  private _shortcuts = new Shortcuts();
  private _sequences = new Sequences();
  private _chords = new Chords();
  private _layouts = new Layouts();
  private _scope = new Scope();
  private _recorder = new Recorder();

  private _target: EventTarget | null = null;
  private _onKeydown: ((e: Event) => void) | null = null;
  private _onKeyup: ((e: Event) => void) | null = null;
  private _onBlur: (() => void) | null = null;
  private _started = false;

  // --- lifecycle ---

  init(opts?: InitOptions): void {
    if (this._started) return;
    this._target = opts?.target ?? window;
    if (opts?.scope) this._scope.set(opts.scope);

    this._onKeydown = (ev) => this._handleKey(ev as KeyboardEvent, 'keydown');
    this._onKeyup = (ev) => this._handleKey(ev as KeyboardEvent, 'keyup');
    this._onBlur = () => this._chords.reset();

    this._target.addEventListener('keydown', this._onKeydown);
    this._target.addEventListener('keyup', this._onKeyup);
    window.addEventListener('blur', this._onBlur);
    this._started = true;
  }

  destroy(): void {
    if (!this._started || !this._target) return;
    if (this._onKeydown) this._target.removeEventListener('keydown', this._onKeydown);
    if (this._onKeyup) this._target.removeEventListener('keyup', this._onKeyup);
    if (this._onBlur) window.removeEventListener('blur', this._onBlur);
    this._started = false;
  }

  // --- shortcut API ---

  /** Register a hotkey. Accepts a single combo string or an array for sequences. */
  on(
    combo: string,
    handler: (e: KeyboardEvent) => void,
    opts?: ShortcutOptions,
  ): () => void;
  on(
    sequence: string[],
    handler: () => void,
    opts?: SequenceOptions,
  ): () => void;
  on(
    combo: string | string[],
    handler: ((e: KeyboardEvent) => void) | (() => void),
    opts?: ShortcutOptions | SequenceOptions,
  ): () => void {
    if (Array.isArray(combo)) {
      return this._sequences.add(combo, handler as () => void, opts as SequenceOptions);
    }
    return this._shortcuts.add(combo, handler as (e: KeyboardEvent) => void, opts);
  }

  /** Remove all bindings for a combo. */
  off(combo: string): void {
    this._shortcuts.removeByCombo(combo);
  }

  /** Register a chord — keys held simultaneously. */
  chord(keys: string[], handler: () => void, opts?: ChordOptions): () => void {
    return this._chords.add(keys, handler, opts);
  }

  /** List every registered shortcut — useful for building help dialogs. */
  list(): Array<{ combo: string; scope: string }> {
    return this._shortcuts.list().map((b) => ({
      combo: formatCombo(b.combo),
      scope: b.opts.scope,
    }));
  }

  clear(): void {
    this._shortcuts.clear();
    this._sequences.clear();
    this._chords.clear();
  }

  // --- scope ---

  scope(name?: string, opts?: { exclusive?: boolean }): string {
    if (name) this._scope.set(name, opts);
    return this._scope.active;
  }

  /**
   * Push a scope onto the stack. When `exclusive: true`, global bindings
   * are suppressed while this scope is active — ideal for modals.
   */
  pushScope(name: string, opts?: { exclusive?: boolean }): () => void {
    return this._scope.push(name, opts);
  }

  popScope(name?: string): void {
    this._scope.pop(name);
  }

  // --- layout ---

  layout(name?: LayoutName): LayoutName {
    if (name) this._layouts.set(name);
    return this._layouts.name;
  }

  // --- recorder ---

  record(): void { this._recorder.start(); }
  stop(): RecordedKey[] { return this._recorder.stop(); }

  /**
   * Replay a recording — dispatches synthetic KeyboardEvents at the original
   * inter-key timing (or faster with `speed`). Emits a 'replay' event per key.
   */
  async replay(recording: RecordedKey[], speed = 1): Promise<void> {
    if (recording.length === 0) return;
    const first = recording[0];
    if (!first) return;
    const baseOffset = first.at;
    const target = this._target ?? window;

    for (const entry of recording) {
      const wait = Math.max(0, (entry.at - baseOffset) / speed);
      await new Promise((r) => setTimeout(r, wait));
      this._ev.emit('replay', entry);
      const ev = new KeyboardEvent('keydown', {
        key: entry.combo.key,
        ctrlKey: entry.combo.mods.has('control'),
        altKey: entry.combo.mods.has('alt'),
        shiftKey: entry.combo.mods.has('shift'),
        metaKey: entry.combo.mods.has('meta'),
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(ev);
    }
  }

  // --- events (library-internal lifecycle) ---

  onEvent(event: string, fn: (...args: unknown[]) => void): () => void {
    return this._ev.on(event, fn);
  }

  // --- platform ---

  /** Detected platform: 'mac' | 'windows' | 'linux' | 'other'. */
  get platform(): Platform { return PLATFORM; }

  /** True on macOS / iPadOS / iOS. */
  get isMac(): boolean { return IS_MAC; }

  /**
   * The physical modifier that `mod` resolves to on this platform.
   * 'meta' on Mac, 'control' on Windows/Linux.
   * Use when building help UI: `Kb.modKey // "meta" | "control"`.
   */
  get modKey(): 'meta' | 'control' { return MOD_MODIFIER; }

  // --- helpers ---

  format(combo: string): string {
    return formatCombo(parseCombo(combo));
  }

  // --- internal ---

  private _handleKey(ev: KeyboardEvent, type: 'keydown' | 'keyup'): void {
    if (type === 'keydown') this._recorder.capture(ev);
    if (type === 'keyup') { this._chords.up(ev); return; }

    // Raw stream — fires for every keydown even if no binding matches
    this._ev.emit('keydown', ev);

    const inInput = this._isEditable(ev.target);

    // 1. Chord detection (simultaneous keys)
    const chords = this._chords.down(ev, this._scope.active);
    for (const c of chords) {
      c.handler();
      this._ev.emit('chord', c);
    }

    // 2. Shortcut matching
    const matches = this._shortcuts.match(ev, type);
    let handled = false;
    for (const b of matches) {
      if (!this._scope.matches(b.opts.scope)) continue;
      if (inInput && !b.opts.allowInInput) continue;
      if (b.opts.preventDefault) ev.preventDefault();
      b.handler(ev);
      this._ev.emit('shortcut', b);
      handled = true;
    }

    // 3. Sequence detection — independent of shortcut matching
    const fired = this._sequences.feed(ev, this._scope.active);
    for (const s of fired) {
      if (inInput) continue;
      s.handler();
      this._ev.emit('sequence', s);
      handled = true;
    }

    if (handled) this._ev.emit('handled', ev);
  }

  private _isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return target.isContentEditable;
  }
}

const keyboard = new Keyboard();
export default keyboard;

export type {
  ShortcutOptions, SequenceOptions, ChordOptions,
  LayoutName, RecordedKey, Platform,
};
