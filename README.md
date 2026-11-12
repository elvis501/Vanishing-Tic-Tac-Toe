# Vanishing Tic Tac Toe

A twist on the classic Tic Tac Toe — each player can hold **at most 3 marks** on the board at any time. Place a 4th mark and your **oldest mark flies over to that new cell**. Plan ahead or lose your position!

**[Play Live on GitHub Pages](https://elvis501.github.io/Vanishing-Tic-Tac-Toe/)**

---

## How to Play

- Two players take turns placing **X** and **O** on a 3×3 grid
- Each player can have a **maximum of 3 marks** on the board
- When you place your **4th mark**, your **oldest mark moves** to the chosen cell (FIFO)
- First to align **3 in a row** (horizontally, vertically, or diagonally) wins
- No draws — the board never fills up completely
- Pick **2 Players** for hot-seat or **vs Computer** (Easy / Medium / Hard) above the queues

## Features

- Ghost highlight shows which of your marks will move next
- Dashed arrow previews where the oldest mark will fly on your 4th move
- Queue panel displays your active marks oldest → newest
- Smooth pop-in and flying-mark move animations
- Local computer opponent (minimax + alpha-beta, plus a precomputed opening book) with Easy / Medium / Hard
- Match score saved between sessions, starting player alternates each game
- Subtle sound effects with a mute toggle
- Hover preview shows where your mark will land
- Win screen with random quips per player
- Fully responsive — works on mobile
- Installable as an app (PWA) — own icon, full screen, works offline

## Tech

Pure HTML, CSS, and JavaScript (fonts from Google Fonts; sounds are generated with WebAudio, no audio files; the computer opponent runs fully in the browser, no API or server). The installable-app layer is a small `manifest.json` plus a `sw.js` service worker and PNG icons — the game itself is still one `index.html`.

## Install on Your Phone

Open the live site in the phone's browser, then:

- **Android / Chrome** — tap the **Install app** prompt (or ⋮ menu → *Add to Home screen*)
- **iPhone / Safari** — Share → **Add to Home Screen**

It then opens full screen with its own icon and keeps working without an internet connection.

## Run Locally

```bash
# Just open the file in your browser
open index.html

# Service worker (offline / install) needs HTTP, not file://
python -m http.server 8000
# then visit http://localhost:8000
```
