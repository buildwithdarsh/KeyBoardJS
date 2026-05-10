interface Frame {
  name: string;
  exclusive: boolean;
}

/**
 * Scope manager — lets shortcuts be grouped by context (e.g. "editor",
 * "modal", "global").
 *
 * Normally, bindings with `scope: 'global'` always fire and scope-specific
 * bindings only fire when that scope is active. An `exclusive` scope
 * suppresses global bindings while active — useful for modals where
 * underlying shortcuts should stop firing.
 */
export class Scope {
  private _stack: Frame[] = [{ name: 'global', exclusive: false }];

  get active(): string {
    return this._stack[this._stack.length - 1]?.name ?? 'global';
  }

  get isExclusive(): boolean {
    return this._stack[this._stack.length - 1]?.exclusive ?? false;
  }

  /** Replace the current scope. */
  set(name: string, opts?: { exclusive?: boolean }): void {
    this._stack = [{ name, exclusive: opts?.exclusive ?? false }];
  }

  /** Push a temporary scope — useful for modals. */
  push(name: string, opts?: { exclusive?: boolean }): () => void {
    const frame: Frame = { name, exclusive: opts?.exclusive ?? false };
    this._stack.push(frame);
    return () => this.pop(name);
  }

  /** Pop either the specific scope or the topmost. */
  pop(name?: string): void {
    if (!name) {
      if (this._stack.length > 1) this._stack.pop();
      return;
    }
    const idx = this._stack.map((f) => f.name).lastIndexOf(name);
    if (idx > 0) this._stack.splice(idx, 1);
  }

  reset(): void {
    this._stack = [{ name: 'global', exclusive: false }];
  }

  matches(scope: string): boolean {
    const active = this.active;
    if (scope === active) return true;
    if (scope === 'global') return !this.isExclusive;
    return false;
  }
}
