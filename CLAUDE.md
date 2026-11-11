# Vanishing XO — Project Notes

## Project Overview

Single-file browser game: a twist on Tic Tac Toe where each player can hold at most **3 marks** on the board at any time. Placing a 4th mark **moves the oldest one onto the newly chosen cell** (FIFO queue) — the mark visibly flies across the board instead of disappearing. Playable hot-seat (2 players) or against a **local minimax computer opponent** (Easy / Medium / Hard). One external dependency: **Google Fonts (Quicksand)** loaded via `<link>` in `<head>`.

## File Structure

```
Vanishing Tic Tac Toe/
└── index.html   ← entire game (HTML + embedded CSS + embedded JS)
```

## Game Rules

- Standard 3×3 grid, 2 players (X and O) — hot-seat or against the local computer
- Each player has a FIFO queue of their placed marks (max 3)
- On the 4th placement, queue[0] (oldest) **relocates onto the chosen cell** — its old cell is freed and the mark animates across the board. Final board state is identical to "remove oldest + place new"
- **Win check happens AFTER the oldest mark is moved** — `board[]` and `queues[]` are updated to final state first, then `checkWin()` runs; the flight animation follows after
- No draw condition — cells are always freed, so the game always ends with a win

## Architecture (JavaScript)

### State

```js
board         // Array(9).fill(null) — 'X', 'O', or null per cell
queues        // { X: [...cellIndices], O: [...cellIndices] } — oldest first
currentPlayer // 'X' | 'O'
gameOver      // boolean
isAnimating   // boolean — blocks clicks during the mark's flight
wins          // { X: number, O: number } — match score, persisted
starter       // 'X' | 'O' — who makes the first move of the current game
soundOn       // boolean — muted state, persisted
audioCtx      // lazily created AudioContext | null
flyAnim, flyEl// active WAAPI animation + its DOM clone (for cancelFlight)
winTimer      // id of the pending showWin() timeout
mode          // '2p' | 'ai' — persisted
difficulty    // 'easy' | 'medium' | 'hard' — persisted
aiThinking    // boolean — computer is "thinking"; blocks human input
aiTimer       // id of the pending computer move
```

### Key Functions

| Function | Purpose |
|---|---|
| `initState()` | Resets all state variables (`currentPlayer = starter`) |
| `buildBoard()` | Creates the `#move-line` SVG + 9 `.cell` divs; attaches click, key, hover and focus handlers |
| `handleClick(idx)` | Core game logic — place, check win, fly the oldest mark, then `finishTurn()` |
| `finishTurn(player, winLine)` | Shared turn tail — record win + highlight, or switch player and re-render |
| `flyMark(fromCell, toCell, player, done)` | Animates the oldest mark travelling to the new cell (WAAPI), then calls `done` |
| `cancelFlight()` | Aborts an in-progress flight (New Game pressed mid-animation) |
| `setCellMark(cell, player, opts)` | Sets or clears a cell's DOM content (`opts.entering` / `opts.landing`) |
| `showMovePreview(idx)` | Draws the dashed arrow from the oldest mark to a hovered/focused empty cell |
| `hideMovePreview()` | Clears `.previewing` / `.armed` and hides the arrow |
| `refreshGhost()` | Adds `.ghost` class to **both** players' oldest cells (if their queue is full) |
| `checkWin(player, board)` | Returns winning line array or null |
| `renderTurnIndicator()` | Updates the pill at the top |
| `renderQueues()` / `renderPlayerQueue(player)` | Renders queue badges + hint text |
| `renderScore(bumpPlayer)` | Fills every `[data-wins]` element; optional bump animation for the scorer |
| `recordWin(player)` | Increments the score, persists it, re-renders |
| `showWin(player)` | Populates and reveals the win overlay (score + who starts next) |
| `resetGame()` | Cancels flight/timer, alternates `starter`, re-inits state, rebuilds board |
| `loadMeta()` / `readStore()` / `writeStore()` | localStorage persistence (wrapped in try/catch) |
| `setSound(on, persist)` | Mute toggle — syncs button state, aria attributes and storage |
| `tone()` / `sfx` | Tiny WebAudio synth: `place`, `takeoff`, `land`, `win` |
| `maybeRunAI()` | Schedules the computer move (AI_DELAY) when it's its turn; cancels otherwise |
| `chooseAIMove()` | Picks a move: immediate win → optional blunder → depth-limited search |
| `aiSearch(...)` | Minimax + alpha-beta with path-based cycle detection, returns a score |
| `aiApplyMove(state, player, idx)` | Pure state transition used by the search |
| `aiEvaluate(state)` | Heuristic: line value, discounted when built on the oldest mark |
| `renderModeUI()` | Syncs mode/difficulty buttons, `aria-pressed`, labels and diff visibility |

> `getCell(i)` uses `#board.querySelectorAll('.cell')[i]` (not `children[i]`) because the preview SVG is the board's first child.

### Click Flow

```
handleClick(idx)
  ├── guard: gameOver || cell occupied || isAnimating → return
  ├── hideMovePreview()
  ├── determine moveFrom = queues[player][0] if queue.length === 3
  ├── [STATE] board[idx] = player, queue.push(idx)
  ├── [STATE] if moveFrom: board[moveFrom] = null, queue.shift()   ← BEFORE win check
  ├── checkWin(player, board)   ← sees final board state
  ├── if moveFrom === null (plain placement):
  │     setCellMark(cell, entering: true)    ← pop-in animation
  │     sfx.place()
  │     finishTurn()
  ├── if moveFrom (4th mark):
  │     isAnimating = true
  │     fromCell: remove .ghost, clear DOM (mark "lifts off")
  │     toCell:   add .occupied + color class (suppress hover preview, show target)
  │     renderQueues(), sfx.takeoff()
  │     flyMark(fromCell, toCell, player, done)
  │       └── WAAPI: from → arc (lift + scale 1.22) → to, duration MOVE_MS (460ms)
  │           destination positioned via getBoundingClientRect + transform translate
  │     done(): setCellMark(toCell, landing: true), isAnimating = false, finishTurn()
  └── finishTurn(player, winLine):
        if win: gameOver = true, recordWin(player), sfx.win(), refreshGhost(),
                renderQueues(), add .win-cell to line,
                winTimer = setTimeout(showWin, WIN_HOLD_MS)
        else:  switch currentPlayer, update #board[data-player],
                refreshGhost(), renderTurnIndicator(), renderQueues()
```

## CSS Design Tokens

```css
--x:      #00e5ff   /* cyan  — Player X */
--o:      #ff6d3b   /* orange — Player O */
--bg:     #080814   /* near-black background */
--surface:  #10101e
--surface2: #17172c
--border:   #252542
--anim:   340ms     /* animation duration — used in both CSS and JS */
```

## Typography

- **Font**: Quicksand (Google Fonts) — weights 400/500/600/700
- **Fallback**: `'Segoe UI', system-ui, -apple-system, sans-serif`

## Animations

| Class | Effect |
|---|---|
| `.entering` | `pop-in`: scale 0 → 1.22 → 1 with slight rotate, spring curve |
| `.landing` | `land-pop`: scale 1.28 → 0.92 → 1, plays when a relocated mark arrives |
| `.ghost` | `vanish-pulse`: opacity oscillates 1 → 0.18 → 1 (1.1s loop) |
| `.win-cell` | `win-pulse`: scale 1 → 1.1 → 1 (0.65s loop) + colored box-shadow |

Animations are removed via `animationend` listeners to avoid conflicting with `.ghost` if that cell later becomes the oldest.

### Move Animation (4th mark)

`flyMark()` clones the mark into a `position: fixed` `.fly-mark` element sized/positioned over the source cell, clears the source cell, and animates it with WAAPI (`element.animate()`): start → midpoint offset by `-26px` on the Y axis with `scale(1.22)` (arc + lift) → destination, over `MOVE_MS = 460ms`. On `onfinish` the clone is removed, the mark is placed on the destination with `.landing`, and the turn continues. Under `prefers-reduced-motion` the duration collapses to `1ms`. `isAnimating` blocks input for the whole flight.

All animations respect `@media (prefers-reduced-motion: reduce)` — durations collapse to `0.01ms`.

## Queue Panel Display

- Shows badges oldest → newest, each with a superscript cell number (1–9)
- When `queue.length === 3`: oldest badge goes dashed + faded, hint shows `← cell N moves next`
- During a move the displayed queue is already the post-move state (the relocated mark sits at the end)
- Both players' queues are always visible; active player's card has a glowing border

## Ghost (About-to-Move) Highlight

**Both players'** oldest marks are ghosted simultaneously whenever their respective queues are full. This lets each player always see which mark will relocate on their next move, regardless of whose turn it is. `refreshGhost()` iterates over `['X', 'O']` and adds `.ghost` to `queues[p][0]` for each player with `queue.length === 3`.

## Hover Preview

```css
#board[data-player="X"] .cell:not(.occupied):hover::after { content: 'X'; color: var(--x); }
#board[data-player="O"] .cell:not(.occupied):hover::after { content: 'O'; color: var(--o); }
```

`data-player` on `#board` is updated on every turn switch.

### Move-preview arrow (queue full only)

While the current player's queue is full, hovering (mouse) or focusing an empty cell previews the relocation:

- `showMovePreview(idx)` — only when `!gameOver && !isAnimating && board[idx] === null` and `queues[currentPlayer].length === 3`
- Draws a dashed line in `#move-line` (absolute SVG, `z-index: 2`, `pointer-events: none`) from the oldest mark's centre to the hovered cell's centre; both endpoints are pulled toward the cell edges via `pad = cellSize * 0.44` so the arrow doesn't sit on the marks
- Coordinates are computed with `getBoundingClientRect()` relative to the SVG's own rect
- Adds `.armed` to the source cell (stops the ghost pulse, scales the mark 1.1×, dashed frame + glow) and `.previewing` to `#board`
- Triggered on `pointerenter` (mouse only — `e.pointerType === 'mouse'`), `focus`, and hidden on `pointerleave`, `blur`, click and reset
- Arrow color comes from `#move-line.x` / `#move-line.o` (`currentColor` also fills the SVG marker)

## Top Bar

`#topbar` is a `1fr auto 1fr` grid the width of the board, so the turn pill stays centred while two round `.btn-icon` buttons sit on the right:

- **Sound toggle** (`#sound-toggle`) — swaps `.snd-on` / `.snd-off` SVGs via the `.muted` class, updates `aria-pressed` / `aria-label`, persists to `localStorage`
- **New Game** (`#new-game`) — always available (not just on the win screen); calls `resetGame()`

## Controls Row

`#controls` sits between the board and the queues — two segmented pills (`.seg`):

- **Mode**: `2 Players` / `vs Computer` (`[data-mode]`, persisted). Changing mode always calls `resetGame()` so a game never continues in a mixed role state
- **Difficulty**: `Easy` / `Medium` / `Hard` (`[data-diff]`, persisted). Hidden in 2P mode via the `hidden` attribute + `.seg[hidden] { display: none }` (needed because `.seg` sets `display: flex`)
- `renderModeUI()` keeps `.active` / `aria-pressed` in sync and relabels the O queue card to "◯ Computer" in AI mode

## Computer Opponent (AI)

The computer is **O**, the human is **X**. Everything runs locally in the page — no network, no API keys.

- Move generation: all empty cells; `aiApplyMove()` mirrors the live rules (place, then relocate the oldest when the queue is full)
- **Search**: depth-limited minimax with alpha-beta pruning in `aiSearch()`. `SEARCH_DEPTH = { easy: 1, medium: 3, hard: 6 }`; a 250 ms deadline keeps the UI responsive
- **Cycles**: positions can repeat (marks relocate), so the search carries a path-based `Set` of state keys (`board|queuesX|queuesO`) and scores repeats as `0` instead of recursing forever
- **Terminal scoring**: a win is `±(10000 + remaining depth)`, so faster wins are preferred and the search stops as soon as a winning move is found
- **Evaluation** (`aiEvaluate`): 2-in-line = 16, 1-in-line = 2, center = 4. If a 2-in-line includes that player's *oldest* mark while their queue is full, it is discounted to 5 — that mark relocates on their next move, so the line is fragile
- **Move ordering**: center → corners → edges for better pruning
- **Difficulty flavour**: Easy always takes an immediate win, otherwise 35 % random move; Medium 10 % random; Hard never blunders
- **Turn flow**: `finishTurn()` (no win) and `resetGame()` call `maybeRunAI()`, which waits `AI_DELAY = 450 ms` ("Computer thinking…"), then calls `handleClick(idx)` like a human would (so sounds/animations come for free)
- **Input blocking**: cell click/keydown handlers and `showMovePreview()` bail out while `aiThinking` is true; the computer itself calls `handleClick` directly
- If the starter alternates to O, the computer opens the game
- Win overlay says "Computer Wins!" and "You/Computer starts the next game" in AI mode

## Score & Persistence

- Wins are shown in each queue header (`[data-wins]` in `.q-wins`) and again on the win card; `recordWin()` bumps the scorer's number with the `score-bump` animation
- `starter` alternates **every new game** (`resetGame()` flips it), so neither player always moves first
- `localStorage` keys (all reads/writes wrapped in try/catch, so private mode / file:// failures are harmless):
  - `vxo:wins` — JSON `{ "X": n, "O": n }`
  - `vxo:starter` — `'X' | 'O'`
  - `vxo:sound` — `'1' | '0'` (missing = on)
  - `vxo:mode` — `'2p' | 'ai'`
  - `vxo:diff` — `'easy' | 'medium' | 'hard'`
- Persisted state is loaded by `loadMeta()` before `initState()` at boot

## Sound

Procedural WebAudio only — no audio files:

- `getAudio()` lazily creates/resumes the `AudioContext` on first user gesture; returns `null` while muted
- `tone(freq, { to, dur, gain, type, delay })` builds a short envelope around one oscillator
- `sfx.place` (plain placement), `sfx.takeoff` (mark lifts off), `sfx.land` (mark arrives), `sfx.win` (4-note arpeggio)
- `setSound(on, persist)` is the single entry point for mute state (button, aria, storage)

## Win Screen

- Sliding card with spring animation (`cubic-bezier(0.34,1.56,0.64,1)`)
- Shimmer gradient button with `background-position` animation
- Win check fires **after** the oldest mark relocates in state; the highlight is applied once the flight finishes (`flyMark` callback), so the arriving mark is visible
- The overlay is delayed by `WIN_HOLD_MS = 2200ms` so the winning line keeps blinking on the board first (plus `showWin`'s own 150ms fade-in delay)
- Random quip from `QUIPS[player]` array per win
- Shows the running match score and who starts the next game
- `.win-card` gets class `x` or `o` on win — used by `::before` pseudo-element to add a subtle radial glow in the winner's color (opacity 0.06)
- `showWin()` sets `card.className = 'win-card ' + lc` to apply the color class

## Edge Cases Handled

- **New Game during a flight** → `cancelFlight()` cancels the WAAPI animation and removes the clone; `onfinish` doesn't fire, so no stale mark is placed
- **New Game during the win hold** → `winTimer` is cleared and `showWin()` + the overlay's 150ms timer both check `gameOver`
- **Mode switch / New Game while the computer is thinking** → `aiTimer` is cleared and `aiThinking` reset, so no stray computer move lands on the new board
- **Clicks during a flight** → blocked by `isAnimating`
- **Clicks during the computer's turn** → blocked by `aiThinking`

## Responsiveness

- Board: `min(330px, 92vw)` — fills mobile width
- Queue panels: side-by-side flex; stack vertically on screens ≤ 360px via media query
- Font sizes: `clamp()` throughout

## Accessibility & Keyboard Navigation

- All 9 cells have `tabindex="0"` — keyboard users can Tab through the board
- `keydown` listener on each cell: Enter or Space triggers `handleClick(i)`
- Focusing an empty cell previews the relocation arrow, same as hover
- Turn pill has `aria-live="polite"`; icon buttons carry `aria-label` + `title`, and the sound toggle exposes `aria-pressed`
- `:focus-visible` rings on cells (`#7070b0`), icon buttons and the replay button (`rgba(255,255,255,0.7)`)
- `@media (prefers-reduced-motion: reduce)` disables all animations and transitions

## Background

Body uses 4-layer `background-image`:
1. Purple top glow (ellipse, 50% –5%)
2. Blue bottom-left glow
3. Orange bottom-right glow
4. Dot grid: `radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)` at `28px 28px`

`background-size` must be set explicitly to `auto, auto, auto, 28px 28px` for the dot grid layer to tile correctly.
