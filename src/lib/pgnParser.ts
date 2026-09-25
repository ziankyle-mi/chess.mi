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
    title: 'Donald Byrne vs Bobby Fischer (Game of the Century, 1956)',
    desc: '13-year-old Bobby Fischer stuns the world with 17...Be6!! and an unstoppable queen sacrifice windmill.',
    category: 'Fischer Masterpiece',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[Round "8"]
[White "Donald Byrne"]
[Black "Robert James Fischer"]
[Result "0-1"]
[ECO "D92"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`
  },
  {
    title: 'Elizabeth Harmon vs Vasily Borgov (The Queen\'s Gambit, Moscow 1968)',
    desc: 'The iconic finale of The Queen\'s Gambit. Harmon plays the Queen\'s Gambit Declined and breaks through Borgov\'s kingside.',
    category: "The Queen's Gambit",
    pgn: `[Event "Tournament of Champions"]
[Site "Moscow URS"]
[Date "1968.10.15"]
[Round "7"]
[White "Elizabeth Harmon"]
[Black "Vasily Borgov"]
[Result "1-0"]
[ECO "D41"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c5 5. cxd5 Nxd5 6. e4 Nxc3 7. bxc3 cxd4 8. cxd4 Bb4+ 9. Bd2 Bxd2+ 10. Qxd2 O-O 11. Bc4 Nc6 12. O-O b6 13. Rad1 Bb7 14. Rfe1 Na5 15. Bd3 Rc8 16. d5 exd5 17. e5 Nc4 18. Qf4 Nb2 19. Bxh7+ Kxh7 20. Ng5+ Kg6 21. h4 Rc4 22. h5+ Kh6 23. Nxf7+ Kh7 24. Qf5+ Kg8 25. e6 Qf6 26. Qxf6 gxf6 27. Rd2 Rc6 28. Rxb2 Re8 29. Nh6+ Kh7 30. Nf5 Rexe6 31. Rxe6 Rxe6 32. Rc2 Rc6 33. Re2 Bc8 34. Re7+ Kh8 35. Nh4 f5 36. Ng6+ Kg8 37. Rxa7 1-0`
  },
  {
    title: 'Mikhail Tal vs Mikhail Botvinnik (World Ch. 1960, Game 6)',
    desc: 'The Magician from Riga shocks Botvinnik with the daring 21...Nf4!! knight sacrifice, sparking total tactical fireworks.',
    category: 'Mikhail Tal Classic',
    pgn: `[Event "World Championship Match"]
[Site "Moscow URS"]
[Date "1960.03.26"]
[Round "6"]
[White "Mikhail Botvinnik"]
[Black "Mikhail Tal"]
[Result "0-1"]
[ECO "E69"]

1. c4 Nf6 2. Nf3 g6 3. g3 Bg7 4. Bg2 O-O 5. d4 d6 6. Nc3 Nbd7 7. O-O e5 8. e4 c6 9. h3 Qb6 10. d5 cxd5 11. cxd5 Nc5 12. Ne1 Bd7 13. Nd3 Nxd3 14. Qxd3 Rfc8 15. Rb1 Nh5 16. Be3 Qb4 17. Qe2 Rc4 18. Rfc1 Rac8 19. Kh2 f5 20. exf5 Bxf5 21. Ra1 Nf4 22. gxf4 exf4 23. Bd2 Qxb2 24. Rab1 f3 25. Bxf3 Bxb1 26. Rxb1 Qc2 27. Qe6+ Kh8 28. Rxb7 Rf8 29. Qe7 Rg8 30. Ne4 Rxe4 31. Bxe4 Qxd2 32. Qf7 Qxa2 33. Rxa7 Qe2 34. Bg2 Qe5+ 35. f4 Qd4 36. Rd7 Rf8 37. Qe7 Qxf4+ 38. Kh1 Qc1+ 39. Kh2 Be5+ 40. Qxe5+ dxe5 41. d6 Qf4+ 42. Kh1 Rb8 43. Rb7 Rxb7 44. Bxb7 Qc1+ 45. Kh2 Qd2+ 46. Bg2 Qxd6 0-1`
  },
  {
    title: 'Mikhail Tal vs Bent Larsen (Bled Candidates Semifinal, 1965)',
    desc: 'Tal uncorks the legendary 16.Nd5!! piece sacrifice, obliterating Larsen\'s Sicilian in a relentless attacking storm.',
    category: 'Mikhail Tal Classic',
    pgn: `[Event "Bled Candidates Semifinal"]
[Site "Bled YUG"]
[Date "1965.08.08"]
[Round "10"]
[White "Mikhail Tal"]
[Black "Bent Larsen"]
[Result "1-0"]
[ECO "B82"]

1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 e6 5. Nc3 d6 6. Be3 Nf6 7. f4 Be7 8. Qf3 O-O 9. O-O-O Qc7 10. Ndb5 Qb8 11. g4 a6 12. Nd4 Nxd4 13. Bxd4 b5 14. g5 Nd7 15. Bd3 b4 16. Nd5 exd5 17. exd5 f5 18. Rde1 Rf7 19. h4 Bb7 20. Bxf5 Rxf5 21. Rxe7 Ne5 22. Qe4 Qf8 23. fxe5 Rf4 24. Qe3 Rf3 25. Qe2 Qxe7 26. Qxf3 dxe5 27. Re1 Rd8 28. Rxe5 Qd7 29. Qg3 Bxd5 30. b3 Bf7 31. Re4 Bg6 32. Rf4 Rc8 33. c4 bxc3 34. Qe3 Re8 35. Qxc3 Rc8 36. Bc5 Qd5 37. b4 a5 38. a3 axb4 39. axb4 Qh1+ 40. Kb2 1-0`
  },
  {
    title: 'Garry Kasparov vs Veselin Topalov (Kasparov\'s Immortal, 1999)',
    desc: 'Regarded as the greatest chess game ever played. Kasparov launches 24.Rxd4!! initiating an epic king hunt across the board.',
    category: 'Kasparov Immortal',
    pgn: `[Event "Hoogovens Group A"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]
[ECO "B07"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    title: 'Bobby Fischer vs Boris Spassky (World Ch. 1972, Game 6)',
    desc: 'Fischer plays 1. c4 and executes a positional masterpiece in the Tartakower QGD, drawing applause from Spassky.',
    category: 'World Championship',
    pgn: `[Event "World Championship 28th"]
[Site "Reykjavik ISL"]
[Date "1972.07.23"]
[Round "6"]
[White "Robert James Fischer"]
[Black "Boris Spassky"]
[Result "1-0"]
[ECO "D59"]

1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0`
  },
  {
    title: 'Adolf Anderssen vs Lionel Kieseritzky (The Immortal Game, 1851)',
    desc: 'The definitive romantic era sacrifice: Anderssen sacrifices two rooks, a bishop, and his queen to checkmate.',
    category: 'Romantic Era',
    pgn: `[Event "London Casual Game"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]
[ECO "C33"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`
  },
  {
    title: 'Paul Morphy vs Duke of Brunswick (The Opera Game, 1858)',
    desc: 'An attacking masterpiece illustrating rapid development and sacrificial pins in the Paris Opera House.',
    category: 'Classical Attack',
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
    desc: 'A modern club game featuring early central tension, missed opportunities, and sharp middlegame blunders.',
    category: 'Club Study',
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
  }
]
