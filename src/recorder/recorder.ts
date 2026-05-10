import { eventCombo, formatCombo } from '../utils/keys';
import type { ParsedCombo } from '../utils/keys';

export interface RecordedKey {
  combo: ParsedCombo;
  label: string;
  /** ms offset from start of recording */
  at: number;
}

/**
 * Records and replays key events.
 * `replay` dispatches synthetic KeyboardEvents onto a target (default: window)
 * preserving the original inter-key timing.
 */
export class Recorder {
  private _active = false;
  private _start = 0;
  private _buffer: RecordedKey[] = [];

  get recording(): boolean {
    return this._active;
  }

  start(): void {
    this._buffer = [];
    this._start = Date.now();
    this._active = true;
  }

  stop(): RecordedKey[] {
    this._active = false;
    return this._buffer.slice();
  }

  capture(ev: KeyboardEvent): void {
    if (!this._active) return;
    const combo = eventCombo(ev);
    if (!combo.key) return;
    this._buffer.push({
      combo,
      label: formatCombo(combo),
      at: Date.now() - this._start,
    });
  }

  async replay(
    recording: RecordedKey[],
    target: EventTarget = window,
    speed = 1,
  ): Promise<void> {
    if (recording.length === 0) return;
    const first = recording[0];
    if (!first) return;
    const baseOffset = first.at;

    for (const entry of recording) {
      const wait = Math.max(0, (entry.at - baseOffset) / speed);
      await new Promise((r) => setTimeout(r, wait));
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
}
