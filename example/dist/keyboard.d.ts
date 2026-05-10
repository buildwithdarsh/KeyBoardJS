/**
 * Key normalization utilities.
 * Converts between human-readable names ("ctrl+k", "enter") and the
 * underlying KeyboardEvent representation.
 */
declare const MODIFIER_ORDER: readonly ["control", "alt", "shift", "meta"];
type Modifier = (typeof MODIFIER_ORDER)[number];
interface ParsedCombo {
    key: string;
    mods: Set<Modifier>;
}

interface ShortcutOptions {
    /** Scope name this binding belongs to — only fires when scope is active */
    scope?: string;
    /** Prevent default browser behaviour when matched (default: true) */
    preventDefault?: boolean;
    /** Fire even when typing in input/textarea/contenteditable (default: false) */
    allowInInput?: boolean;
    /** Fire on keyup instead of keydown */
    onKeyup?: boolean;
}

interface SequenceOptions {
    scope?: string;
    /** Reset timeout in ms between keys (default: 1000) */
    timeout?: number;
}

interface ChordOptions {
    scope?: string;
    /** Max time between first and last key press in ms (default: 250) */
    window?: number;
}

type LayoutName = 'qwerty' | 'dvorak' | 'colemak';

interface RecordedKey {
    combo: ParsedCombo;
    label: string;
    /** ms offset from start of recording */
    at: number;
}

/**
 * Platform detection — runs once at module load.
 * Determines how `mod` maps to a physical modifier and how combos
 * are pretty-printed.
 */
type Platform = 'mac' | 'windows' | 'linux' | 'other';

interface InitOptions {
    /** EventTarget to attach listeners to (default: window) */
    target?: EventTarget;
    /** Default scope name when starting (default: "global") */
    scope?: string;
}
declare class Keyboard {
    private _ev;
    private _shortcuts;
    private _sequences;
    private _chords;
    private _layouts;
    private _scope;
    private _recorder;
    private _target;
    private _onKeydown;
    private _onKeyup;
    private _onBlur;
    private _started;
    init(opts?: InitOptions): void;
    destroy(): void;
    /** Register a hotkey. Accepts a single combo string or an array for sequences. */
    on(combo: string, handler: (e: KeyboardEvent) => void, opts?: ShortcutOptions): () => void;
    on(sequence: string[], handler: () => void, opts?: SequenceOptions): () => void;
    /** Remove all bindings for a combo. */
    off(combo: string): void;
    /** Register a chord — keys held simultaneously. */
    chord(keys: string[], handler: () => void, opts?: ChordOptions): () => void;
    /** List every registered shortcut — useful for building help dialogs. */
    list(): Array<{
        combo: string;
        scope: string;
    }>;
    clear(): void;
    scope(name?: string, opts?: {
        exclusive?: boolean;
    }): string;
    /**
     * Push a scope onto the stack. When `exclusive: true`, global bindings
     * are suppressed while this scope is active — ideal for modals.
     */
    pushScope(name: string, opts?: {
        exclusive?: boolean;
    }): () => void;
    popScope(name?: string): void;
    layout(name?: LayoutName): LayoutName;
    record(): void;
    stop(): RecordedKey[];
    /**
     * Replay a recording — dispatches synthetic KeyboardEvents at the original
     * inter-key timing (or faster with `speed`). Emits a 'replay' event per key.
     */
    replay(recording: RecordedKey[], speed?: number): Promise<void>;
    onEvent(event: string, fn: (...args: unknown[]) => void): () => void;
    /** Detected platform: 'mac' | 'windows' | 'linux' | 'other'. */
    get platform(): Platform;
    /** True on macOS / iPadOS / iOS. */
    get isMac(): boolean;
    /**
     * The physical modifier that `mod` resolves to on this platform.
     * 'meta' on Mac, 'control' on Windows/Linux.
     * Use when building help UI: `Kb.modKey // "meta" | "control"`.
     */
    get modKey(): 'meta' | 'control';
    format(combo: string): string;
    private _handleKey;
    private _isEditable;
}
declare const keyboard: Keyboard;

export { keyboard as default };
export type { ChordOptions, InitOptions, LayoutName, Platform, RecordedKey, SequenceOptions, ShortcutOptions };
