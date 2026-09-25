import { Chess } from 'chess.js'

export interface MoveStat {
  move: string // e.g. "1. e4" or "1... c5 (Sicilian)"
  count: number
  frequency: number // 0 - 100%
  wins: number
  draws: number
  losses: number
  winRate: number // 0 - 100%
}

export interface OpeningSystemStat {
  name: string
  eco?: string
  movesSan: string[]
  pgn: string
  fen?: string
  count: number
  frequency: number
  wins: number
  draws: number
  losses: number
  winRate: number
}

export interface AchillesHeel {
  openingName: string
  color: 'White' | 'Black' // what color the OPPONENT played
  gamesCount: number
  lossRate: number
  winRate: number
  advice: string
  movesSan: string[]
  pgn: string
}

export interface OpponentScoutReport {
  username: string
  platform: 'chesscom' | 'lichess'
  rating?: number
  avatarUrl?: string
  totalGames: number
  wins: number
  draws: number
  losses: number
  overallWinRate: number
  avgGameLength: number
  playstyle: string
  dangerPhase: string

  whiteRepertoire: {
    totalGames: number
    winRate: number
    firstMoves: MoveStat[]
    topSystems: OpeningSystemStat[]
  }

  blackRepertoire: {
    totalGames: number
    winRate: number
    vsE4: MoveStat[]
    vsD4: MoveStat[]
    topSystems: OpeningSystemStat[]
  }

  achillesHeels: AchillesHeel[]
}

// Common opening name cleaner
export function cleanOpeningName(rawName: string): string {
  if (!rawName) return 'Custom / Unnamed Opening'
  return rawName
    .replace(/^https?:\/\/www\.chess\.com\/openings\//, '')
    .replace(/-/g, ' ')
    .replace(/:.*$/, '') // Clean up deep subvariations for primary group
    .trim()
}

// Built-in Demo Profiles for instantaneous testing
export const DEMO_SCOUT_PROFILES: Record<string, OpponentScoutReport> = {
  hikaru: {
    username: 'Hikaru',
    platform: 'chesscom',
    rating: 3430,
    totalGames: 50,
    wins: 38,
    draws: 8,
    losses: 4,
    overallWinRate: 76,
    avgGameLength: 34,
    playstyle: 'Dynamic Speed Tactician',
    dangerPhase: 'Deep Endgame (Moves 40+)',
    whiteRepertoire: {
      totalGames: 26,
      winRate: 81,
      firstMoves: [
        { move: '1. e4', count: 18, frequency: 69, wins: 15, draws: 2, losses: 1, winRate: 83 },
        { move: '1. d4', count: 5, frequency: 19, wins: 4, draws: 1, losses: 0, winRate: 80 },
        { move: '1. c4', count: 3, frequency: 12, wins: 2, draws: 0, losses: 1, winRate: 67 }
      ],
      topSystems: [
        {
          name: 'Ruy Lopez: Berlin Defense',
          eco: 'C65',
          movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'],
          pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6',
          count: 8,
          frequency: 31,
          wins: 7,
          draws: 1,
          losses: 0,
          winRate: 88
        },
        {
          name: 'Italian Game: Giuoco Piano',
          eco: 'C53',
          movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
          pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5',
          count: 6,
          frequency: 23,
          wins: 5,
          draws: 1,
          losses: 0,
          winRate: 83
        },
        {
          name: 'English Opening',
          eco: 'A20',
          movesSan: ['c4', 'e5', 'Nc3', 'Nf6'],
          pgn: '1. c4 e5 2. Nc3 Nf6',
          count: 3,
          frequency: 12,
          wins: 2,
          draws: 0,
          losses: 1,
          winRate: 67
        }
      ]
    },
    blackRepertoire: {
      totalGames: 24,
      winRate: 71,
      vsE4: [
        { move: '1... c5 (Sicilian)', count: 14, frequency: 70, wins: 10, draws: 3, losses: 1, winRate: 71 },
        { move: '1... e5 (Open Game)', count: 6, frequency: 30, wins: 4, draws: 1, losses: 1, winRate: 67 }
      ],
      vsD4: [
        { move: "1... Nf6 (King's Indian / Nimzo)", count: 3, frequency: 75, wins: 2, draws: 1, losses: 0, winRate: 67 },
        { move: "1... d5 (Queen's Gambit)", count: 1, frequency: 25, wins: 1, draws: 0, losses: 0, winRate: 100 }
      ],
      topSystems: [
        {
          name: 'Sicilian Defense: Najdorf',
          eco: 'B90',
          movesSan: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
          pgn: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6',
          count: 10,
          frequency: 42,
          wins: 7,
          draws: 2,
          losses: 1,
          winRate: 70
        }
      ]
    },
    achillesHeels: [
      {
        openingName: 'English Opening (Reversed Sicilian)',
        color: 'White',
        gamesCount: 3,
        lossRate: 33,
        winRate: 67,
        advice: 'Opponent occasionally overextends in symmetrical flank structures. Solid 1... e5 setups yield good counter-chances.',
        movesSan: ['c4', 'e5'],
        pgn: '1. c4 e5'
      }
    ]
  },
  clubplayer: {
    username: 'ClubWarrior_1600',
    platform: 'chesscom',
    rating: 1585,
    totalGames: 40,
    wins: 19,
    draws: 3,
    losses: 18,
    overallWinRate: 48,
    avgGameLength: 29,
    playstyle: 'Aggressive Trappist (Early Attack)',
    dangerPhase: 'Middlegame Complexities (Moves 16–24)',
    whiteRepertoire: {
      totalGames: 21,
      winRate: 57,
      firstMoves: [
        { move: '1. e4', count: 18, frequency: 86, wins: 11, draws: 2, losses: 5, winRate: 61 },
        { move: '1. d4 (London)', count: 3, frequency: 14, wins: 1, draws: 0, losses: 2, winRate: 33 }
      ],
      topSystems: [
        {
          name: 'Italian Game: Fried Liver / Knight Attack',
          eco: 'C57',
          movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5'],
          pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5',
          count: 9,
          frequency: 43,
          wins: 6,
          draws: 1,
          losses: 2,
          winRate: 67
        },
        {
          name: 'Scotch Game',
          eco: 'C45',
          movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'],
          pgn: '1. e4 e5 2. Nf3 Nc6 3. d4',
          count: 5,
          frequency: 24,
          wins: 3,
          draws: 1,
          losses: 1,
          winRate: 60
        },
        {
          name: 'London System',
          eco: 'D00',
          movesSan: ['d4', 'd5', 'Bf4', 'Nf6'],
          pgn: '1. d4 d5 2. Bf4 Nf6',
          count: 3,
          frequency: 14,
          wins: 1,
          draws: 0,
          losses: 2,
          winRate: 33
        }
      ]
    },
    blackRepertoire: {
      totalGames: 19,
      winRate: 37,
      vsE4: [
        { move: '1... e5 (Open Game)', count: 12, frequency: 75, wins: 4, draws: 1, losses: 7, winRate: 33 },
        { move: '1... c6 (Caro-Kann)', count: 4, frequency: 25, wins: 2, draws: 0, losses: 2, winRate: 50 }
      ],
      vsD4: [
        { move: '1... d5 (Queen Pawn Game)', count: 3, frequency: 100, wins: 1, draws: 0, losses: 2, winRate: 33 }
      ],
      topSystems: [
        {
          name: 'Italian Game Defense',
          eco: 'C50',
          movesSan: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
          pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4',
          count: 8,
          frequency: 42,
          wins: 2,
          draws: 1,
          losses: 5,
          winRate: 25
        }
      ]
    },
    achillesHeels: [
      {
        openingName: 'Vienna Game & Gambit',
        color: 'Black',
        gamesCount: 5,
        lossRate: 80,
        winRate: 20,
        advice: 'Opponent consistently misplays 1. e4 e5 2. Nc3 Nf6 3. f4, accepting the gambit and falling into King attacks.',
        movesSan: ['e4', 'e5', 'Nc3', 'Nf6', 'f4'],
        pgn: '1. e4 e5 2. Nc3 Nf6 3. f4'
      },
      {
        openingName: 'London System (When playing White)',
        color: 'White',
        gamesCount: 3,
        lossRate: 67,
        winRate: 33,
        advice: 'Opponent lacks familiarity with Black playing an early ...c5 break against the London.',
        movesSan: ['d4', 'd5', 'Bf4', 'c5'],
        pgn: '1. d4 d5 2. Bf4 c5'
      }
    ]
  }
}

// Fetch live scout report from Chess.com
export async function fetchChessComScout(username: string, maxGames = 40): Promise<OpponentScoutReport> {
  const cleanUser = username.trim().toLowerCase()
  const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(cleanUser)}/games/archives`)
  if (!archivesRes.ok) {
    throw new Error(`Player "${username}" not found on Chess.com`)
  }
  const archivesData = await archivesRes.json()
  const archives: string[] = archivesData.archives || []
  if (archives.length === 0) {
    throw new Error(`No games found for "${username}" on Chess.com`)
  }

  // Fetch from the most recent 1-2 monthly archives
  const recentArchives = archives.slice(-2).reverse()
  const rawGames: any[] = []

  for (const archiveUrl of recentArchives) {
    const res = await fetch(archiveUrl)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.games)) {
        rawGames.push(...data.games.reverse())
        if (rawGames.length >= maxGames) break
      }
    }
  }

  const selectedGames = rawGames.slice(0, maxGames)
  if (selectedGames.length === 0) {
    throw new Error(`No completed games found for "${username}"`)
  }

  return processRawGames(cleanUser, selectedGames, 'chesscom')
}

// Fetch live scout report from Lichess
export async function fetchLichessScout(username: string, maxGames = 40): Promise<OpponentScoutReport> {
  const cleanUser = username.trim()
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(cleanUser)}?max=${maxGames}&opening=true&moves=true&perfType=blitz,rapid,classical`
  const res = await fetch(url, {
    headers: { Accept: 'application/x-ndjson' }
  })

  if (!res.ok) {
    throw new Error(`Player "${username}" not found on Lichess`)
  }

  const text = await res.text()
  const lines = text.trim().split('\n').filter(Boolean)
  const games = lines.map((l) => JSON.parse(l))

  if (games.length === 0) {
    throw new Error(`No games found for "${username}" on Lichess`)
  }

  return processRawLichessGames(cleanUser, games)
}

function processRawGames(username: string, games: any[], platform: 'chesscom'): OpponentScoutReport {
  let wins = 0
  let draws = 0
  let losses = 0
  let totalPlies = 0

  const whiteGames: { firstMove: string; openingName: string; win: boolean; draw: boolean; movesSan: string[] }[] = []
  const blackGames: { oppFirstMove: string; myFirstMove: string; openingName: string; win: boolean; draw: boolean; movesSan: string[] }[] = []

  let playerRating = 1500

  for (const g of games) {
    const isWhite = g.white?.username?.toLowerCase() === username
    const isBlack = g.black?.username?.toLowerCase() === username
    if (!isWhite && !isBlack) continue

    if (isWhite && g.white?.rating) playerRating = g.white.rating
    if (isBlack && g.black?.rating) playerRating = g.black.rating

    const myResult = isWhite ? g.white?.result : g.black?.result
    const isWin = myResult === 'win'
    const isDraw = ['agreed', 'repetition', 'stalemate', 'timevsinsufficient', '50move', 'insufficient'].includes(myResult)

    if (isWin) wins++
    else if (isDraw) draws++
    else losses++

    // Parse moves from PGN
    let movesSan: string[] = []
    if (g.pgn) {
      try {
        const chess = new Chess()
        chess.loadPgn(g.pgn)
        movesSan = chess.history()
        totalPlies += movesSan.length
      } catch {
        // fallback
      }
    }

    const openingName = cleanOpeningName(g.eco || '')

    if (isWhite) {
      const firstMove = movesSan[0] ? `1. ${movesSan[0]}` : '1. e4'
      whiteGames.push({
        firstMove,
        openingName: openingName || `Opening with ${firstMove}`,
        win: isWin,
        draw: isDraw,
        movesSan: movesSan.slice(0, 8)
      })
    } else {
      const oppFirst = movesSan[0] ? `1. ${movesSan[0]}` : '1. e4'
      const myFirst = movesSan[1] ? `1... ${movesSan[1]}` : '1... e5'
      blackGames.push({
        oppFirstMove: oppFirst,
        myFirstMove: myFirst,
        openingName: openingName || `Defense with ${myFirst}`,
        win: isWin,
        draw: isDraw,
        movesSan: movesSan.slice(0, 8)
      })
    }
  }

  return aggregateScoutData({
    username,
    platform,
    rating: playerRating,
    totalGames: games.length,
    wins,
    draws,
    losses,
    avgGameLength: Math.max(15, Math.round((totalPlies / (games.length || 1)) / 2)),
    whiteGames,
    blackGames
  })
}

function processRawLichessGames(username: string, games: any[]): OpponentScoutReport {
  let wins = 0
  let draws = 0
  let losses = 0
  let totalPlies = 0

  const whiteGames: { firstMove: string; openingName: string; win: boolean; draw: boolean; movesSan: string[] }[] = []
  const blackGames: { oppFirstMove: string; myFirstMove: string; openingName: string; win: boolean; draw: boolean; movesSan: string[] }[] = []

  let playerRating = 1500

  for (const g of games) {
    const isWhite = g.players?.white?.user?.name?.toLowerCase() === username.toLowerCase()
    const isBlack = g.players?.black?.user?.name?.toLowerCase() === username.toLowerCase()
    if (!isWhite && !isBlack) continue

    if (isWhite && g.players?.white?.rating) playerRating = g.players.white.rating
    if (isBlack && g.players?.black?.rating) playerRating = g.players.black.rating

    const isWin = (isWhite && g.winner === 'white') || (isBlack && g.winner === 'black')
    const isDraw = !g.winner

    if (isWin) wins++
    else if (isDraw) draws++
    else losses++

    const movesSan = (g.moves || '').split(' ').filter(Boolean)
    totalPlies += movesSan.length

    const openingName = cleanOpeningName(g.opening?.name || '')

    if (isWhite) {
      const firstMove = movesSan[0] ? `1. ${movesSan[0]}` : '1. e4'
      whiteGames.push({
        firstMove,
        openingName: openingName || `Opening with ${firstMove}`,
        win: isWin,
        draw: isDraw,
        movesSan: movesSan.slice(0, 8)
      })
    } else {
      const oppFirst = movesSan[0] ? `1. ${movesSan[0]}` : '1. e4'
      const myFirst = movesSan[1] ? `1... ${movesSan[1]}` : '1... e5'
      blackGames.push({
        oppFirstMove: oppFirst,
        myFirstMove: myFirst,
        openingName: openingName || `Defense with ${myFirst}`,
        win: isWin,
        draw: isDraw,
        movesSan: movesSan.slice(0, 8)
      })
    }
  }

  return aggregateScoutData({
    username,
    platform: 'lichess',
    rating: playerRating,
    totalGames: games.length,
    wins,
    draws,
    losses,
    avgGameLength: Math.max(15, Math.round((totalPlies / (games.length || 1)) / 2)),
    whiteGames,
    blackGames
  })
}

function aggregateScoutData({
  username,
  platform,
  rating,
  totalGames,
  wins,
  draws,
  losses,
  avgGameLength,
  whiteGames,
  blackGames
}: {
  username: string
  platform: 'chesscom' | 'lichess'
  rating: number
  totalGames: number
  wins: number
  draws: number
  losses: number
  avgGameLength: number
  whiteGames: { firstMove: string; openingName: string; win: boolean; draw: boolean; movesSan: string[] }[]
  blackGames: { oppFirstMove: string; myFirstMove: string; openingName: string; win: boolean; draw: boolean; movesSan: string[] }[]
}): OpponentScoutReport {
  // Aggregate White First Moves
  const whiteFirstMap = new Map<string, { count: number; wins: number; draws: number; losses: number }>()
  for (const g of whiteGames) {
    const cur = whiteFirstMap.get(g.firstMove) || { count: 0, wins: 0, draws: 0, losses: 0 }
    cur.count++
    if (g.win) cur.wins++
    else if (g.draw) cur.draws++
    else cur.losses++
    whiteFirstMap.set(g.firstMove, cur)
  }

  const whiteFirstMoves: MoveStat[] = Array.from(whiteFirstMap.entries())
    .map(([move, stat]) => ({
      move,
      count: stat.count,
      frequency: Math.round((stat.count / (whiteGames.length || 1)) * 100),
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      winRate: Math.round((stat.wins / (stat.count || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count)

  // Aggregate White Top Systems
  const whiteSystemsMap = new Map<string, { count: number; wins: number; draws: number; losses: number; movesSan: string[] }>()
  for (const g of whiteGames) {
    const cur = whiteSystemsMap.get(g.openingName) || { count: 0, wins: 0, draws: 0, losses: 0, movesSan: g.movesSan }
    cur.count++
    if (g.win) cur.wins++
    else if (g.draw) cur.draws++
    else cur.losses++
    whiteSystemsMap.set(g.openingName, cur)
  }

  const whiteTopSystems: OpeningSystemStat[] = Array.from(whiteSystemsMap.entries())
    .map(([name, stat]) => ({
      name,
      movesSan: stat.movesSan,
      pgn: formatSanToPgn(stat.movesSan),
      count: stat.count,
      frequency: Math.round((stat.count / (whiteGames.length || 1)) * 100),
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      winRate: Math.round((stat.wins / (stat.count || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  // Aggregate Black vs 1.e4 and vs 1.d4
  const vsE4Map = new Map<string, { count: number; wins: number; draws: number; losses: number }>()
  const vsD4Map = new Map<string, { count: number; wins: number; draws: number; losses: number }>()
  const blackSystemsMap = new Map<string, { count: number; wins: number; draws: number; losses: number; movesSan: string[] }>()

  const blackE4Games = blackGames.filter((g) => g.oppFirstMove.includes('e4'))
  const blackD4Games = blackGames.filter((g) => g.oppFirstMove.includes('d4'))

  for (const g of blackE4Games) {
    const cur = vsE4Map.get(g.myFirstMove) || { count: 0, wins: 0, draws: 0, losses: 0 }
    cur.count++
    if (g.win) cur.wins++
    else if (g.draw) cur.draws++
    else cur.losses++
    vsE4Map.set(g.myFirstMove, cur)
  }

  for (const g of blackD4Games) {
    const cur = vsD4Map.get(g.myFirstMove) || { count: 0, wins: 0, draws: 0, losses: 0 }
    cur.count++
    if (g.win) cur.wins++
    else if (g.draw) cur.draws++
    else cur.losses++
    vsD4Map.set(g.myFirstMove, cur)
  }

  for (const g of blackGames) {
    const cur = blackSystemsMap.get(g.openingName) || { count: 0, wins: 0, draws: 0, losses: 0, movesSan: g.movesSan }
    cur.count++
    if (g.win) cur.wins++
    else if (g.draw) cur.draws++
    else cur.losses++
    blackSystemsMap.set(g.openingName, cur)
  }

  const vsE4Stats: MoveStat[] = Array.from(vsE4Map.entries())
    .map(([move, stat]) => ({
      move,
      count: stat.count,
      frequency: Math.round((stat.count / (blackE4Games.length || 1)) * 100),
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      winRate: Math.round((stat.wins / (stat.count || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count)

  const vsD4Stats: MoveStat[] = Array.from(vsD4Map.entries())
    .map(([move, stat]) => ({
      move,
      count: stat.count,
      frequency: Math.round((stat.count / (blackD4Games.length || 1)) * 100),
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      winRate: Math.round((stat.wins / (stat.count || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count)

  const blackTopSystems: OpeningSystemStat[] = Array.from(blackSystemsMap.entries())
    .map(([name, stat]) => ({
      name,
      movesSan: stat.movesSan,
      pgn: formatSanToPgn(stat.movesSan),
      count: stat.count,
      frequency: Math.round((stat.count / (blackGames.length || 1)) * 100),
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      winRate: Math.round((stat.wins / (stat.count || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  // Find Achilles' Heels (Openings where opponent loses most, minimum 2 games)
  const achillesHeels: AchillesHeel[] = []

  // Check black systems where they lose
  for (const [name, stat] of blackSystemsMap.entries()) {
    if (stat.count >= 2 && stat.losses >= 2) {
      const lossRate = Math.round((stat.losses / stat.count) * 100)
      const winRate = Math.round((stat.wins / stat.count) * 100)
      if (lossRate >= 50) {
        achillesHeels.push({
          openingName: name,
          color: 'Black',
          gamesCount: stat.count,
          lossRate,
          winRate,
          advice: `Opponent struggles when defending this line (lost ${stat.losses} of ${stat.count} games, ${winRate}% win rate). Recommend playing this setup.`,
          movesSan: stat.movesSan,
          pgn: formatSanToPgn(stat.movesSan)
        })
      }
    }
  }

  // Check white systems where they lose
  for (const [name, stat] of whiteSystemsMap.entries()) {
    if (stat.count >= 2 && stat.losses >= 2) {
      const lossRate = Math.round((stat.losses / stat.count) * 100)
      const winRate = Math.round((stat.wins / stat.count) * 100)
      if (lossRate >= 50) {
        achillesHeels.push({
          openingName: name,
          color: 'White',
          gamesCount: stat.count,
          lossRate,
          winRate,
          advice: `Opponent has a ${lossRate}% loss rate when initiating this setup as White. Counter aggressively early.`,
          movesSan: stat.movesSan,
          pgn: formatSanToPgn(stat.movesSan)
        })
      }
    }
  }

  achillesHeels.sort((a, b) => b.lossRate - a.lossRate)

  // Determine playstyle DNA
  let playstyle = 'Balanced Classical'
  if (avgGameLength < 28) playstyle = 'Aggressive Tactician'
  else if (avgGameLength > 42) playstyle = 'Positional Grinder'

  const whiteWinRate = Math.round(((whiteGames.filter((g) => g.win).length) / (whiteGames.length || 1)) * 100)
  const blackWinRate = Math.round(((blackGames.filter((g) => g.win).length) / (blackGames.length || 1)) * 100)

  return {
    username,
    platform,
    rating,
    totalGames,
    wins,
    draws,
    losses,
    overallWinRate: Math.round((wins / (totalGames || 1)) * 100),
    avgGameLength,
    playstyle,
    dangerPhase: avgGameLength < 30 ? 'Sharp Opening/Middlegame (Moves 12–22)' : 'Complex Endgame (Moves 35+)',
    whiteRepertoire: {
      totalGames: whiteGames.length,
      winRate: whiteWinRate,
      firstMoves: whiteFirstMoves,
      topSystems: whiteTopSystems
    },
    blackRepertoire: {
      totalGames: blackGames.length,
      winRate: blackWinRate,
      vsE4: vsE4Stats,
      vsD4: vsD4Stats,
      topSystems: blackTopSystems
    },
    achillesHeels: achillesHeels.slice(0, 3)
  }
}

function formatSanToPgn(movesSan: string[]): string {
  let pgn = ''
  for (let i = 0; i < movesSan.length; i++) {
    if (i % 2 === 0) {
      pgn += `${Math.floor(i / 2) + 1}. `
    }
    pgn += `${movesSan[i]} `
  }
  return pgn.trim()
}
