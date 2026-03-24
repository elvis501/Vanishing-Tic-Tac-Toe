# Vanishing XO — Project Notes

## Project Overview

Single-file browser game: a twist on Tic Tac Toe where each player can hold at most **3 marks** on the board at any time. Placing a 4th mark removes the oldest one (FIFO queue). One external dependency: **Google Fonts (Quicksand)** loaded via `<link>` in `<head>`.

## File Structure

```
Vanishing Tic Tac Toe/
└── index.html   ← entire game (HTML + embedded CSS + embedded JS)
```

## Game Rules

- Standard 3×3 grid, 2 players (X and O)
- Each player has a FIFO queue of their placed marks (max 3)
- On the 4th placement, queue[0] (oldest) is removed from the board, freeing that cell
- **Win check happens AFTER the oldest mark is removed** — `board[]` and `queues[]` are updated to final state first, then `checkWin()` runs; the DOM animation follows after
- No draw condition — cells are always freed, so the game always ends with a win

## Architecture (JavaScript)

### State

```js
board         // Array(9).fill(null) — 'X', 'O', or null per cell
queues        // { X: [...cellIndices], O: [...cellIndices] } — oldest first
currentPlayer // 'X' | 'O'
gameOver      // boolean
isAnimating   // boolean — blocks clicks during vanish animation
```

### Key Functions

| Function | Purpose |
|---|---|
| `initState()` | Resets all state variables |
| `buildBoard()` | Creates 9 `.cell` div elements in `#board` |
| `handleClick(idx)` | Core game logic — place, check win, animate vanish, switch turn |
| `setCellMark(cell, player, opts)` | Sets or clears a cell's DOM content |
| `refreshGhost()` | Adds `.ghost` class to **both** players' oldest cells (if their queue is full) |
| `checkWin(player, board)` | Returns winning line array or null |
| `renderTurnIndicator()` | Updates the pill at the top |
| `renderQueues()` | Re-renders both queue panels |
| `renderPlayerQueue(player)` | Renders one player's queue badges + hint text |
| `showWin(player)` | Populates and reveals the win overlay |
| `resetGame()` | Hides overlay, re-inits state, rebuilds board |

### Click Flow

```
handleClick(idx)
  ├── guard: gameOver || cell occupied || isAnimating → return
  ├── determine vanishIdx = queues[player][0] if queue.length === 3
  ├── [STATE] board[idx] = player, queue.push(idx)
  ├── [STATE] if vanishIdx: board[vanishIdx] = null, queue.shift()   ← BEFORE win check
  ├── checkWin(player, board)   ← sees final board state
  ├── [DOM]   setCellMark(new cell, entering: true)   ← pop-in animation
  ├── if win:
  │     if vanishIdx: add .exiting to vanish cell, clear DOM after ANIM_MS
  │     refreshGhost(), renderQueues()
  │     setTimeout(ANIM_MS): highlight win cells, showWin()  → return
  ├── if vanishIdx (no win):
  │     isAnimating = true
  │     add .exiting to vanish cell   ← pop-out animation
  │     renderQueues() immediately
  │     setTimeout(ANIM_MS):
  │       setCellMark(vanish cell, null)
  │       isAnimating = false
  │       switch currentPlayer, refreshGhost, render UI
  └── else: switch currentPlayer, refreshGhost, render UI
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
| `.exiting` | `pop-out`: scale 1 → 1.25 → 0, ease-in |
| `.ghost` | `vanish-pulse`: opacity oscillates 1 → 0.18 → 1 (1.1s loop) |
| `.win-cell` | `win-pulse`: scale 1 → 1.1 → 1 (0.65s loop) + colored box-shadow |

Entering animation is removed via `animationend` listener to avoid conflicting with `.ghost` if that cell later becomes the oldest.

All animations respect `@media (prefers-reduced-motion: reduce)` — durations collapse to `0.01ms`.

## Queue Panel Display

- Shows badges oldest → newest, each with a superscript cell number (1–9)
- When `queue.length === 3`: oldest badge goes dashed + faded, hint shows `← cell N vanishes next`
- During animation (`queue.length === 4`): displays `queue.slice(1)` — the 3 marks that will remain after vanish — so the UI reflects the post-animation state instantly
- Both players' queues are always visible; active player's card has a glowing border

## Ghost (About-to-Vanish) Highlight

**Both players'** oldest marks are ghosted simultaneously whenever their respective queues are full. This lets each player always see what they stand to lose, regardless of whose turn it is. `refreshGhost()` iterates over `['X', 'O']` and adds `.ghost` to `queues[p][0]` for each player with `queue.length === 3`.

## Hover Preview

```css
#board[data-player="X"] .cell:not(.occupied):hover::after { content: 'X'; color: var(--x); }
#board[data-player="O"] .cell:not(.occupied):hover::after { content: 'O'; color: var(--o); }
```

`data-player` on `#board` is updated on every turn switch.

## Win Screen

- Sliding card with spring animation (`cubic-bezier(0.34,1.56,0.64,1)`)
- Shimmer gradient button with `background-position` animation
- Win check fires **after** oldest mark removal from state; card appears after `ANIM_MS` delay so both entering and exiting DOM animations finish first
- Random quip from `QUIPS[player]` array per win
- `.win-card` gets class `x` or `o` on win — used by `::before` pseudo-element to add a subtle radial glow in the winner's color (opacity 0.06)
- `showWin()` sets `card.className = 'win-card ' + lc` to apply the color class

## Responsiveness

- Board: `min(330px, 92vw)` — fills mobile width
- Queue panels: side-by-side flex; stack vertically on screens ≤ 360px via media query
- Font sizes: `clamp()` throughout

## Accessibility & Keyboard Navigation

- All 9 cells have `tabindex="0"` — keyboard users can Tab through the board
- `keydown` listener on each cell: Enter or Space triggers `handleClick(i)`
- `:focus-visible` rings on cells (`#7070b0`) and the replay button (`rgba(255,255,255,0.7)`)
- `@media (prefers-reduced-motion: reduce)` disables all animations and transitions

## Background

Body uses 4-layer `background-image`:
1. Purple top glow (ellipse, 50% –5%)
2. Blue bottom-left glow
3. Orange bottom-right glow
4. Dot grid: `radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)` at `28px 28px`

`background-size` must be set explicitly to `auto, auto, auto, 28px 28px` for the dot grid layer to tile correctly.
