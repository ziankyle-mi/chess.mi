# chess.mi

A chess review and sparring app that runs entirely in your browser. No backend, no accounts, no server costs.

**Live:** https://chess-mi.vercel.app

## What it does

- **Game review.** Paste a PGN or import from Chess.com. Every move gets a label, an accuracy score, and a short explanation.
- **Analysis.** Step through the game with an eval bar, an eval graph, and best-move arrows.
- **Sparring.** Play Stockfish bots at set strength levels.
- **Opponent scout.** Enter a Chess.com or Lichess username to see their openings and win rates.
- **Stats and study plan.** Your reviewed games are saved in your browser. The app finds your most common blunder pattern and suggests what to work on.

## How it works

Stockfish runs as WebAssembly inside a Web Worker, so the UI stays responsive. Nothing leaves your browser except the Chess.com and Lichess API calls for importing games.

For each move, the app does this:

1. Stockfish evaluates the position after the move (depth 10). That eval is reused as the "before" eval for the next move, so each position is searched once.
2. The eval in centipawns is converted to a win percentage with a sigmoid curve.
3. The drop in win percentage is the move's loss.
4. The loss is converted to a 0 to 100 move accuracy.
5. Thresholds pick the label: Best, Great, Good, Inaccuracy, Mistake, Miss, or Blunder. Thresholds are looser in the opening and tighter in the endgame.

The formulas follow the ones Lichess has published. Scores will not match Chess.com exactly.

### Explanations

Move explanations are rule-based. They are built from board features like attackers, checks, captures, and hanging pieces, plus a hand-written opening tips file. There are no AI calls and no API.

### Opening detection

Openings are matched against an ECO database and a curated set of theory lines. Book moves are only labeled Book if they don't lose evaluation.

## Known limits

- Analysis depth is 10 to keep reviews fast. Deeper search would find more errors.
- If Stockfish fails to load or a search takes too long, the app falls back to a simple static evaluator. Results from the fallback are much weaker.
- The opponent scout shows sample data for the demo profiles only.
- Coach explanations use templates, so some moves get generic text.

## Run locally

```bash
git clone https://github.com/ziankyle-mi/chess.mi.git
cd chess.mi
npm install
npm run dev
```

Open http://localhost:5173.

## Stack

React, TypeScript, Vite, Tailwind CSS, chess.js, react-chessboard, Stockfish (WASM).

## Structure

```
src/
  engine/       Stockfish worker, move classification, batch analysis, opening theory
  lib/          PGN parser, Chess.com API, pattern detection, progress storage
  components/   Board, move list, eval bar, review report, sparring, scout
  data/         ECO openings and opening tips
```

## Author

Made by [ziankyle.mi](https://github.com/ziankyle-mi).
