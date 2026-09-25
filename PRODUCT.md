# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Chess players — beginner to intermediate — who play on chess.com and want engine analysis, game review, coaching diagnostics, and progress tracking without paying for chess.com's premium subscription. They import games via PGN or sync from their chess.com account and expect the same depth of feedback that premium tiers gate behind a paywall.

## Product Purpose

chess.mi is a free, open-source chess analysis and coaching tool that replaces the features chess.com locks behind its paywall. It provides full Stockfish-powered game review, move classification (brilliant → blunder), opening identification, personalized coaching based on a rolling 20-game window, aggregate stats, and a curated library of legendary games to study. Success means a player can import any game, get the same quality analysis chess.com charges for, and track their improvement over time — all at zero cost.

## Positioning

The only free tool that bundles engine analysis, move-by-move review, coaching diagnostics, progress stats, and game study into one interface — explicitly built to eliminate the need for chess.com premium. "chess.com paywall? fuck you."

## Operating Context

Players copy PGN from chess.com or sync their 20 most recent games via the chess.com public API. Analysis runs client-side with Stockfish WASM — no server, no account, no data leaves the browser. The rolling 20-game FIFO window feeds all coach diagnostics: phase-specific accuracy (opening, middlegame, endgame), tactical pattern detection, weakness identification, and drill recommendations. Games can also be loaded from a curated sample library (Fischer, Tal, Kasparov, Beth Harmon/Queen's Gambit, etc.) for study.

## Capabilities and Constraints

- Stockfish WASM engine for move evaluation and classification
- PGN import (paste or file) and chess.com API sync (public games only)
- Move classification: brilliant, great, good, book, inaccuracy, mistake, blunder
- Opening identification via ECO code database
- Eval bar, eval graph, and move explanations
- Stats dashboard: accuracy, classification breakdown, phase accuracy
- Coach tab: 20-game rolling diagnostics, weakness detection, drill suggestions
- Game study: curated legendary games with commentary
- Theme system: board themes (8 options) and app themes (Dark, OLED, Light)
- Constraint: all computation is client-side; no backend, no database, no user accounts
- Constraint: chess.com API is public-only; no access to private or premium data
- Storage: localStorage for game history and settings

## Brand Commitments

- Name: chess.mi
- Voice: direct, no-bullshit, anti-paywall
- The product exists as a statement against paywalled chess tools

## Evidence on Hand

- Working Vite + React + TypeScript codebase with all features functional
- Deployed sample games (legendary games library)
- No testimonials, press, or case studies. Do not fabricate any.

## Product Principles

1. **Free means free.** No premium tier, no feature gates, no upsells. Every feature ships to every user.
2. **Client-side sovereignty.** All analysis runs in the browser. No data leaves the machine. No accounts required.
3. **Signal over noise.** Show the numbers that matter (accuracy, rating, weaknesses) loudly. Suppress everything else.
4. **Respect the player's time.** Fast sync, fast analysis, fast navigation. No tutorials, no onboarding flows, no tooltips unless asked.
5. **Honest feedback.** The engine doesn't soften blunders or inflate accuracy. The coach tells you where you're weak, not where you're comfortable.
