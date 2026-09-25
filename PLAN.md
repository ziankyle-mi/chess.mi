# Chess Analyzer — Build Plan

A free, no-backend, no-paid-API chess analysis website. You paste a PGN or type a chess.com username, it analyzes your games like chess.com does, but explains *why* a move was wrong and coaches you on the openings you actually play. Zen black-and-white design, no AI slop.

---

## Tech Stack

| Piece | Tool | Why |
|---|---|---|
| Framework | React + TypeScript | You already use this on ClarityBox |
| Styling | Tailwind CSS | Fast, and easy to keep strictly black/white/gray |
| Chess logic | `chess.js` | Move validation, PGN parsing, board state |
| Board UI | `react-chessboard` | Drag-and-drop board like chess.com |
| Engine | `stockfish.wasm` | Runs fully in-browser via a Web Worker, free, no server |
| Opening ID | ECO opening database (static JSON, e.g. `chess-openings` npm package) | Free lookup table, no API |
| Chess.com import | Chess.com public API (`api.chess.com/pub/player/{username}/games`) | Free, no key required |
| Progress storage | `localStorage` | No login, no database |
| Hosting | Vercel or GitHub Pages | Fully static site, free tier |

Nothing here needs a paid key or a server. The whole thing can ship as a static site.

---

## Suggested Folder Structure

```
chess-analyzer/
├── public/
│   └── stockfish/              # stockfish.wasm files
├── src/
│   ├── components/
│   │   ├── Board.tsx
│   │   ├── MoveList.tsx
│   │   ├── EvalBar.tsx
│   │   ├── GameImport.tsx      # PGN paste + chess.com username field
│   │   ├── StatsDashboard.tsx
│   │   └── StudyNext.tsx
│   ├── engine/
│   │   ├── stockfishWorker.ts  # web worker wrapper
│   │   └── classifyMove.ts     # best/good/inaccuracy/mistake/blunder logic
│   ├── data/
│   │   ├── openings.json       # ECO database
│   │   └── openingTips.json    # your precomputed coaching content
│   ├── lib/
│   │   ├── pgnParser.ts
│   │   ├── chesscomApi.ts
│   │   ├── patternDetection.ts # hanging piece, missed fork, etc.
│   │   └── progressStore.ts    # localStorage read/write
│   ├── styles/
│   │   └── theme.css           # black/white/gray tokens only
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.ts
└── package.json
```

---

## Build Order

### Phase 1 — Board and PGN skeleton
Set up `react-chessboard` and `chess.js`. Add a PGN paste box that loads a game and lets you step through moves with arrow keys. Build the zen black-and-white look here first, since everything else is built on top of it: flat colors, thin 1px borders, no shadows, no gradients, no rounded neumorphic buttons.
**Uses:** React, TypeScript, Tailwind, `chess.js`, `react-chessboard`

### Phase 2 — Chess.com import
Add a username field. Fetch the player's game archive from the free chess.com API, list recent games, load one into the board using the same loader from Phase 1.
**Uses:** `chesscomApi.ts`, `fetch`

### Phase 3 — Stockfish in a Web Worker
The trickiest part. Load `stockfish.wasm` inside a Web Worker so it doesn't freeze the UI. Feed it each position from the loaded game and get back an eval score and best line. Cap search depth around 14–16 for speed. Budget extra debugging time here for worker message passing.
**Uses:** `stockfish.wasm`, Web Workers API

### Phase 4 — Move classification and opening detection
Compare the eval before and after each move to bucket it: best, good, inaccuracy, mistake, blunder (same thresholds chess.com uses). Match the game's opening moves against the ECO database to identify the opening and variation.
**Uses:** `classifyMove.ts`, `openings.json`

### Phase 5 — Explanations and opening coaching
Combine rule-based pattern detection (hanging piece, missed fork/pin/skewer, wrong trade, king left in center) with a precomputed `openingTips.json` file you write once ahead of time. This is where the Caro-Kann-style "here's the plan in this opening" coaching lives.
**Uses:** `patternDetection.ts`, `openingTips.json`

### Phase 6 — Critical moments and repeated mistakes
From the eval swings, flag the two or three moments per game that actually mattered, keep the rest muted in the move list. Aggregate blunders across every analyzed game to surface the single mistake pattern costing you the most points.
**Uses:** aggregation logic in `lib/`, `StatsDashboard.tsx`

### Phase 7 — Progress tracking and study-next nudge
Save each analyzed game's stats to `localStorage`. Chart average centipawn loss over your last 20 games. Add one plain-text line on the dashboard telling you the single thing to work on next, based on where you're losing the most points.
**Uses:** `progressStore.ts`, a lightweight chart (plain SVG or `recharts`)

### Phase 8 — Polish and deploy
Strip anything not black, white, or grayscale. Check spacing and typography read as clean and intentional, not templated. Deploy as a static site.
**Uses:** Vercel or GitHub Pages

---

## Design Rules (Zen, Black & White, No AI Slop)

- Colors: black, white, and grayscale only. No accent colors, no green/red for eval (use shape or position instead, e.g. bar fill direction).
- No gradients, no drop shadows, no glassmorphism, no rounded neumorphic buttons.
- Flat surfaces, thin 1px borders.
- Generous whitespace.
- Typography: a clean sans-serif for body text, monospace for numbers and evals (moves, centipawn loss, ratings).
- Layout: board on one side, move list and eval on the other, chess.com's structure without chess.com's color.

---

## Feature Checklist

- [x] PGN paste import
- [x] Chess.com username import
- [x] Interactive board with move stepping
- [x] Local Stockfish analysis (no server)
- [x] Move quality classification
- [x] Opening detection
- [x] Plain-English "why you were wrong" explanations
- [x] Opening-specific coaching tips
- [x] Critical moment highlighting
- [x] Repeated mistake aggregation
- [x] Progress tracking over time (localStorage)
- [x] "Study this next" dashboard nudge
- [x] Average elo across analyzed games
