import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'

export interface ParsedMove {
  index: number // 0-indexed overall move count
  ply: number // move number * 2 + (black ? 1 : 0)
  moveNumber: number // 1, 2, 3...
  color: Color // 'w' | 'b'
  san: string // 'Nf3', 'O-O', 'exd5'
  lan: string // 'g1f3'
  from: Square
  to: Square
  piece: PieceSymbol
  captured?: PieceSymbol
  promotion?: PieceSymbol
  fenBefore: string
  fenAfter: string
  // Engine analysis fields will be attached here
  eval?: number // centipawns from White's perspective (+150 = +1.5, -200 = -2.0)
  mate?: number // moves to mate if any
  bestMoveSan?: string
  bestMoveLan?: string
  classification?: MoveClassification
  moveAccuracy?: number
  winLoss?: number
  explanation?: string
  tacticalPattern?: string
  isCritical?: boolean
}

export type MoveClassification = 
  | 'brilliant'
  | 'great'
  | 'book' 
  | 'best' 
  | 'excellent' 
  | 'good' 
  | 'inaccuracy' 
  | 'mistake' 
  | 'miss'
  | 'blunder'

export interface GameMetadata {
  event?: string
  site?: string
  date?: string
  round?: string
  white: string
  black: string
  result: string
  whiteElo?: string
  blackElo?: string
  eco?: string
  opening?: string
  timeControl?: string
}

export interface ParsedGame {
  metadata: GameMetadata
  moves: ParsedMove[]
  initialFen: string
  openingName?: string
  ecoCode?: string
}

export function parsePgn(pgnString: string): ParsedGame {
  const chess = new Chess()
  try {
    chess.loadPgn(pgnString)
  } catch (err) {
    // If strict parsing fails, try cleaning up whitespace
    chess.loadPgn(pgnString.trim())
  }

  const rawHeaders = chess.header()
  const metadata: GameMetadata = {
    event: rawHeaders.Event || 'Casual Game',
    site: rawHeaders.Site || 'Chess.com / PGN',
    date: rawHeaders.Date || new Date().toISOString().slice(0, 10),
    round: rawHeaders.Round || '1',
    white: rawHeaders.White || 'White',
    black: rawHeaders.Black || 'Black',
    result: rawHeaders.Result || '*',
    whiteElo: rawHeaders.WhiteElo || undefined,
    blackElo: rawHeaders.BlackElo || undefined,
    eco: rawHeaders.ECO || undefined,
    opening: rawHeaders.Opening || undefined,
    timeControl: rawHeaders.TimeControl || undefined
  }

  const history = chess.history({ verbose: true })
  const moves: ParsedMove[] = history.map((m, idx) => ({
    index: idx,
    ply: idx + 1,
    moveNumber: Math.floor(idx / 2) + 1,
    color: m.color,
    san: m.san,
    lan: m.lan,
    from: m.from,
    to: m.to,
    piece: m.piece,
    captured: m.captured,
    promotion: m.promotion,
    fenBefore: m.before,
    fenAfter: m.after
  }))

  return {
    metadata,
    moves,
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  }
}

export const SAMPLE_GAMES = [
  {
    title: 'Paul Morphy vs Duke of Brunswick (The Opera Game, 1858)',
    desc: 'An attacking masterpiece illustrating rapid development and sacrificial pins.',
    pgn: `[Event "Paris Opera"]
[Site "Paris FRA"]
[Date "1858.10.21"]
[Round "1"]
[White "Paul Morphy"]
[Black "Duke of Brunswick and Count Isouard"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`
  },
  {
    title: 'Club Level: Caro-Kann Tactical Battle',
    desc: 'A modern club game featuring early central tension, missed opportunities, and middlegame blunders.',
    pgn: `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.03.15"]
[White "TacticalPlayer"]
[Black "SolidDefender"]
[Result "1-0"]
[WhiteElo "1420"]
[BlackElo "1385"]
[ECO "B12"]

1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. c3 Nc6 7. O-O Nge7 8. dxc5 Ng6 9. b4 Ngxe5 10. Nxe5 Nxe5 11. Bb5+ Nc6 12. Qa4 Qc7 13. Bf4 Qd7 14. Nd2 Be7 15. Nf3 f6 16. Nd4 Rc8 17. Nxf5 exf5 18. Rfe1 O-O 19. Rad1 a6 20. Bc4 b5 21. cxb6 1-0`
  },
  {
    title: 'Bobby Fischer vs Boris Spassky (World Ch. 1972, Game 6)',
    desc: 'Fischer plays 1. c4 and executes a positional squeeze in the Tartakower QGD.',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik ISL"]
[Date "1972.07.23"]
[Round "6"]
[White "Robert James Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]
[ECO "D59"]

1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0`
  }
]
