# Vanishing Tic Tac Toe

A twist on the classic Tic Tac Toe — each player can hold **at most 3 marks** on the board at any time. Place a 4th mark and your oldest one vanishes. Plan ahead or lose your advantage!

**[Play Live on GitHub Pages](https://elvis501.github.io/Vanishing-Tic-Tac-Toe/)**

---

## How to Play

- Two players take turns placing **X** and **O** on a 3×3 grid
- Each player can have a **maximum of 3 marks** on the board
- When you place your **4th mark**, your **oldest mark disappears** (FIFO)
- First to align **3 in a row** (horizontally, vertically, or diagonally) wins
- No draws — the board never fills up completely

## Features

- Ghost highlight shows which of your marks is about to vanish
- Queue panel displays your active marks oldest → newest
- Smooth pop-in / pop-out animations
- Hover preview shows where your mark will land
- Win screen with random quips per player
- Fully responsive — works on mobile

## Tech

Pure HTML, CSS, and JavaScript — **no dependencies, single file**.

## Run Locally

```bash
# Just open the file in your browser
open index.html
```
