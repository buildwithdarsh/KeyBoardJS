> This project is made with the help of Claude (1M context).

<div align="center">

<br />

<img src="https://img.shields.io/badge/keyboardjs-v1.0.0-30d158?style=for-the-badge&labelColor=000000" alt="version" />
<img src="https://img.shields.io/badge/gzip-~4KB-ff9f0a?style=for-the-badge&labelColor=000000" alt="gzip" />
<img src="https://img.shields.io/badge/dependencies-0-bf5af2?style=for-the-badge&labelColor=000000" alt="deps" />
<img src="https://img.shields.io/badge/license-MIT-ff375f?style=for-the-badge&labelColor=000000" alt="license" />

<br /><br />

# KeyBoardJS

**The tiny keyboard library.**

Hotkeys, sequences, chords, scopes, layouts, and a recorder — all in one script tag. Zero dependencies, TypeScript first.

</div>

---

## Why KeyBoardJS?

| | hotkeys-js | Mousetrap | **KeyBoardJS** |
|---|---|---|---|
| Hotkeys | Yes | Yes | **Yes** |
| Key sequences (`g g`) | No | Yes | **Yes** |
| Chords (hold `j+k`) | No | No | **Yes** |
| Named scopes | Partial | No | **Yes** (stackable) |
| Layout remap (Dvorak/Colemak) | No | No | **Yes** |
| Record + replay | No | No | **Yes** |
| TypeScript-first | No | No | **Yes** |
| Gzip size | ~3KB | ~3KB | **~4KB (everything)** |

---

## Quick Start

```html
<script src="https://keyboardjs.work.withdarsh.com/dist/keyboard.umd.js"></script>
<script>
  Keyboard.init();

  Keyboard.on('ctrl+k', () => openPalette());
  Keyboard.on(['g', 'g'], () => window.scrollTo(0, 0));
  Keyboard.chord(['j', 'k'], () => exitInsertMode());
</script>
```

Or with a bundler:

```ts
import Kb from 'KeyBoardJS';

Kb.init();
Kb.on('shift+?', () => showHelp());
```

---

## API

### `Kb.init(opts?)`
Attach listeners to `window` (or a custom `EventTarget`).

### `Kb.on(combo, handler, opts?)`
Register a hotkey. Accepts `'ctrl+k'` style strings.

```js
Kb.on('ctrl+shift+p', (e) => { ... }, {
  scope: 'editor',      // only fire in this scope
  allowInInput: false,  // ignore when typing in inputs
  preventDefault: true, // stop default browser behaviour
});
```

### `Kb.on([k1, k2, ...], handler, opts?)`
Register a **sequence**. Fires when keys are pressed in order within `timeout` ms.

```js
Kb.on(['g', 'g'], gotoTop, { timeout: 800 });
```

### `Kb.chord([k1, k2, ...], handler, opts?)`
Register a **chord** — keys pressed simultaneously within `window` ms.

```js
Kb.chord(['j', 'k'], exitInsertMode, { window: 200 });
```

### Scopes

```js
Kb.scope('editor');          // activate
Kb.scope();                  // read current
const pop = Kb.pushScope('modal');
pop();                       // restore previous
```

Bindings with `scope: 'global'` always fire. Others only fire in the active scope.

### Layouts

```js
Kb.layout('dvorak'); // or 'colemak' | 'qwerty'
```

### Recorder

```js
Kb.record();
// ... user types ...
const frames = Kb.stop();
await Kb.replay(frames, 2); // 2x speed
```

### Misc

```js
Kb.off('ctrl+k');    // remove
Kb.clear();          // remove all
Kb.list();           // [{ combo, scope }, ...] — good for help dialogs
Kb.format('ctrl+k'); // "Ctrl + K"
```

---

## Platform support (Mac / Windows / Linux)

Use `mod` (a.k.a. `cmdOrCtrl`) for bindings that should work the same on every OS:

```js
Kb.on('mod+k', openPalette);   // ⌘K on Mac, Ctrl+K on Windows/Linux
Kb.on('mod+shift+p', command); // ⇧⌘P / Ctrl+Shift+P
```

Inspect the detected platform:

```js
Kb.platform   // 'mac' | 'windows' | 'linux' | 'other'
Kb.isMac      // true on macOS / iPadOS / iOS
Kb.modKey     // 'meta' (Mac) or 'control' (PC)
Kb.format('mod+shift+k')  // "⇧⌘K" on Mac, "Ctrl + Shift + K" on PC
```

`Kb.format()` returns Mac glyphs (`⌘ ⌥ ⇧ ⌃ ↵ ⌫ ⇥`) on Apple platforms and word labels (`Ctrl + Shift + K`) elsewhere — drop straight into tooltips and help dialogs.

## Key names

Case-insensitive. Aliases supported:

- `mod` / `cmdOrCtrl` / `commandOrControl` — **platform-aware** (Cmd on Mac, Ctrl elsewhere)
- `ctrl` / `control`
- `cmd` / `meta` / `command` / `win`
- `alt` / `option` / `opt`
- `esc` / `escape`
- `return` / `enter`
- `space` / `spacebar`
- `up` / `down` / `left` / `right` (arrow keys)
- `pgup` / `pgdn`, `del`, `ins`

---

## License

MIT © Darsh Gupta
