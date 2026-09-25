# chess.mi

A free, private, and unlimited chess review & sparring app created by **ziankyle.mi**.

No subscriptions, no accounts, and no backend — runs 100% in your browser using local Stockfish WASM.

---

## Features

- **Unlimited Game Review**: Stockfish depth 18 move analysis with Chess.com-style accuracy, opening theory detection, and clean classification badges.
- **Sparring Mode**: Play against bots of any rating (250–2200 Elo) with live coach feedback, custom time controls, and touch-smooth premoves.
- **Opponent Scout**: Scan any Chess.com player's profile to extract openings, win rates, and tactical tendencies before a match.
- **Coach & Leak Detection**: Phase-by-phase performance breakdown (Opening, Middlegame, Endgame) identifying recurring blunder patterns.
- **1-Click Import**: Paste standard PGNs or fetch games directly from Chess.com.
- **100% Client-Side**: No server, zero data collected, fully private.

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/ziankyle-mi/chess.mi.git
cd chess.mi

# Install dependencies
npm install

# Run locally
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## Tech Stack

- **Framework**: React, TypeScript, Vite
- **Engine**: Stockfish WASM (Web Worker), chess.js
- **Created by**: [ziankyle.mi](https://github.com/ziankyle-mi)
