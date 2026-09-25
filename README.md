# chess.mi ♟️

A clean, minimalist chess review & coaching platform designed to completely bypass predatory paywalls. Unlimited deep Stockfish engine analysis, move-by-move game reviews, tactical leak detection, and personalized coaching without paying a single cent.

---

### Why?

Chess.com restricts free users to **1 game review per day** and gates coaching insights behind expensive subscriptions. **chess.mi** gives you unlimited reviews, full depth analysis, and custom coaching locally in your browser.

---

### Features

- ⚡ **Unlimited Game Review**: Brilliant, Great, Best, Book, Mistake, Miss & Blunder move classifications powered by Stockfish.
- 🎯 **Personalized AI Coach**: Isolates your moves to evaluate **Game Phase Mastery** (Opening 1–12, Middlegame 13–30, Endgame 31+).
- 🔄 **Rolling 20-Game FIFO Buffer**: Tracks your latest 20 games from Chess.com with automatic FIFO queueing, ensuring your study plan is always fresh.
- 🔍 **Tactical Leak Detection**: Pinpoints exact blunder patterns (hanging pieces, missed pins, calculation dips) with targeted training drills.
- 📦 **1-Click Chess.com Import**: Fetch any player's archives or paste standard PGNs instantly.
- 🌐 **100% Client-Side**: Runs locally with Stockfish Web Workers. No paywalls, no tracking, no rate limits.

---

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ziankyle-mi/chess.mi.git
cd chess.mi

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Chess Engine**: Stockfish (WASM / Web Worker), chess.js
- **Icons**: Lucide React
