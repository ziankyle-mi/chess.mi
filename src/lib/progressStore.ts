export interface GamePhaseData {
  openingAcc: number
  middlegameAcc: number
  endgameAcc: number
  openingBlunders: number
  middlegameBlunders: number
  endgameBlunders: number
  openingCount: number
  middlegameCount: number
  endgameCount: number
}

export interface AnalyzedGameRecord {
  id: string
  date: string
  white: string
  black: string
  whiteElo?: number
  blackElo?: number
  result: string
  eco: string
  opening: string
  whiteAccuracy: number
  blackAccuracy: number
  whiteAcpl: number // Average Centipawn Loss
  blackAcpl: number
  whiteBlunders: number
  blackBlunders: number
  whiteMistakes: number
  blackMistakes: number
  whiteInaccuracies: number
  blackInaccuracies: number
  blunderPatterns: Record<string, number>
  whiteBlunderPatterns?: Record<string, number>
  blackBlunderPatterns?: Record<string, number>
  whitePhases?: GamePhaseData
  blackPhases?: GamePhaseData
  pgn?: string
  timeControl?: string
  endTime?: number
}

export interface PhaseStats {
  accuracy: number
  blunders: number
  movesCount: number
  status: 'strong' | 'solid' | 'weak'
  statusLabel: string
  summary: string
}

export interface UserAccountStats {
  username: string
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  avgAccuracy: number
  whiteAccuracy: number
  blackAccuracy: number
  whiteGames: number
  blackGames: number
  phases: {
    opening: PhaseStats
    middlegame: PhaseStats
    endgame: PhaseStats
    strongestPhase: 'Opening' | 'Middlegame' | 'Endgame'
    weakestPhase: 'Opening' | 'Middlegame' | 'Endgame'
  }
  strengths: string[]
  weaknesses: string[]
  tacticalLeaks: { pattern: string; count: number; percentage: number }[]
  recommendedDrills: { title: string; category: string; description: string; priority: 'high' | 'medium' }[]
  recent20Games?: AnalyzedGameRecord[]
}

export interface AggregateStats {
  totalGames: number
  avgElo: number
  avgAcplLast20: number
  avgAccuracy: number
  trendData: { id: string; date: string; acpl: number; accuracy: number }[]
  topBlunderPattern: { pattern: string; count: number; percentage: number } | null
  studyNextNudge: string
  userStats?: UserAccountStats | null
}

const STORAGE_KEY = 'chess_analyzer_history_v1'
const USER_ACCOUNT_KEY = 'chess_user_account'

export function getUserAccount(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(USER_ACCOUNT_KEY) || ''
  } catch {
    return ''
  }
}

export function setUserAccount(username: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USER_ACCOUNT_KEY, username.trim())
  } catch (err) {
    console.warn('Failed saving user account:', err)
  }
}

export function getStoredGames(): AnalyzedGameRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed reading games from localStorage:', err)
    return []
  }
}

export function saveAnalyzedGame(game: AnalyzedGameRecord): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getStoredGames()
    // Avoid duplicate saves for the same game id
    const filtered = existing.filter((g) => g.id !== game.id)
    // Strictly keep the latest 20 games (First In, First Out)
    const updated = [game, ...filtered].slice(0, 20)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn('Failed saving game to localStorage:', err)
  }
}

export function saveAnalyzedGamesBatch(newGames: AnalyzedGameRecord[]): AnalyzedGameRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const existing = getStoredGames()
    const newIds = new Set(newGames.map((g) => g.id))
    const filtered = existing.filter((g) => !newIds.has(g.id))
    // Strictly keep the latest 20 games (FIFO)
    const updated = [...newGames, ...filtered].slice(0, 20)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('Failed saving batch games to localStorage:', err)
    return getStoredGames()
  }
}

export function clearStoredGames(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function calculateUserAccountStats(
  games: AnalyzedGameRecord[],
  username: string
): UserAccountStats | null {
  if (!username || !username.trim()) return null
  const cleanUser = username.trim().toLowerCase()

  // Find all games where the user played White or Black, strictly limited to latest 20 (FIFO)
  const userMatches = games
    .filter(
      (g) =>
        g.white.toLowerCase().includes(cleanUser) ||
        g.black.toLowerCase().includes(cleanUser)
    )
    .slice(0, 20)

  if (userMatches.length === 0) return null

  let wins = 0, losses = 0, draws = 0
  let whiteCount = 0, blackCount = 0
  let whiteAccSum = 0, blackAccSum = 0

  let opAccSum = 0, opCount = 0, opBlunders = 0
  let midAccSum = 0, midCount = 0, midBlunders = 0
  let endAccSum = 0, endCount = 0, endBlunders = 0

  const userBlunderPatterns: Record<string, number> = {}
  let totalUserBlunders = 0

  userMatches.forEach((g) => {
    const isWhite = g.white.toLowerCase().includes(cleanUser)
    const isBlack = g.black.toLowerCase().includes(cleanUser)

    if (isWhite) {
      whiteCount++
      whiteAccSum += g.whiteAccuracy
      if (g.result === '1-0') wins++
      else if (g.result === '0-1') losses++
      else draws++

      if (g.whitePhases) {
        if (g.whitePhases.openingCount > 0) {
          opAccSum += g.whitePhases.openingAcc
          opCount++
          opBlunders += g.whitePhases.openingBlunders
        }
        if (g.whitePhases.middlegameCount > 0) {
          midAccSum += g.whitePhases.middlegameAcc
          midCount++
          midBlunders += g.whitePhases.middlegameBlunders
        }
        if (g.whitePhases.endgameCount > 0) {
          endAccSum += g.whitePhases.endgameAcc
          endCount++
          endBlunders += g.whitePhases.endgameBlunders
        }
      }

      const pMap = g.whiteBlunderPatterns || g.blunderPatterns || {}
      Object.entries(pMap).forEach(([pat, cnt]) => {
        userBlunderPatterns[pat] = (userBlunderPatterns[pat] || 0) + cnt
        totalUserBlunders += cnt
      })
    } else if (isBlack) {
      blackCount++
      blackAccSum += g.blackAccuracy
      if (g.result === '0-1') wins++
      else if (g.result === '1-0') losses++
      else draws++

      if (g.blackPhases) {
        if (g.blackPhases.openingCount > 0) {
          opAccSum += g.blackPhases.openingAcc
          opCount++
          opBlunders += g.blackPhases.openingBlunders
        }
        if (g.blackPhases.middlegameCount > 0) {
          midAccSum += g.blackPhases.middlegameAcc
          midCount++
          midBlunders += g.blackPhases.middlegameBlunders
        }
        if (g.blackPhases.endgameCount > 0) {
          endAccSum += g.blackPhases.endgameAcc
          endCount++
          endBlunders += g.blackPhases.endgameBlunders
        }
      }

      const pMap = g.blackBlunderPatterns || g.blunderPatterns || {}
      Object.entries(pMap).forEach(([pat, cnt]) => {
        userBlunderPatterns[pat] = (userBlunderPatterns[pat] || 0) + cnt
        totalUserBlunders += cnt
      })
    }
  })

  const totalUserGames = userMatches.length
  const winRate = Math.round((wins / totalUserGames) * 100)
  const avgAccuracy = Math.round(((whiteAccSum + blackAccSum) / totalUserGames) * 10) / 10
  const whiteAccuracy = whiteCount > 0 ? Math.round((whiteAccSum / whiteCount) * 10) / 10 : avgAccuracy
  const blackAccuracy = blackCount > 0 ? Math.round((blackAccSum / blackCount) * 10) / 10 : avgAccuracy

  const opAcc = opCount > 0 ? Math.round((opAccSum / opCount) * 10) / 10 : Math.round(avgAccuracy * 1.05 * 10) / 10
  const midAcc = midCount > 0 ? Math.round((midAccSum / midCount) * 10) / 10 : Math.round(avgAccuracy * 0.94 * 10) / 10
  const endAcc = endCount > 0 ? Math.round((endAccSum / endCount) * 10) / 10 : Math.round(avgAccuracy * 0.98 * 10) / 10

  // Determine strongest and weakest phases with realistic weighting
  const phaseScores = [
    { name: 'Opening' as const, score: opAcc - (opBlunders * 1.5) },
    { name: 'Middlegame' as const, score: midAcc - (midBlunders * 1.5) },
    { name: 'Endgame' as const, score: endAcc - (endBlunders * 1.5) }
  ].sort((a, b) => b.score - a.score)

  const strongestPhase = phaseScores[0].name
  const weakestPhase = phaseScores[phaseScores.length - 1].name

  const getPhaseMeta = (
    phaseName: 'Opening' | 'Middlegame' | 'Endgame',
    acc: number,
    blunders: number,
    isStrongest: boolean,
    isWeakest: boolean
  ): { status: 'strong' | 'solid' | 'weak'; label: string; summary: string } => {
    if (isStrongest) {
      return {
        status: 'strong',
        label: 'Strongest Phase',
        summary: phaseName === 'Opening'
          ? `Solid opening fundamentals (${acc}% accuracy). Controls the center and safely navigates into the middlegame.`
          : phaseName === 'Middlegame'
          ? `Sharp tactical vision (${acc}% accuracy). Handles multi-piece fights and piece coordination cleanly.`
          : `Reliable endgame conversion (${acc}% accuracy). Activates the king and creates passed pawns efficiently.`
      }
    }
    if (isWeakest) {
      return {
        status: 'weak',
        label: 'Primary Focus',
        summary: phaseName === 'Opening'
          ? `Struggles in the first 10-12 moves (${acc}% accuracy, ${blunders} blunders). Conceding early space or piece pins.`
          : phaseName === 'Middlegame'
          ? `Primary tactical battleground (${acc}% accuracy, ${blunders} blunders). Material is dropped during sharp piece exchanges.`
          : `Endgame conversion needs practice (${acc}% accuracy, ${blunders} blunders). Tends to surrender leads in simplified boards.`
      }
    }
    return {
      status: 'solid',
      label: 'Developing',
      summary: phaseName === 'Opening'
        ? `Decent opening setups (${acc}% accuracy). A few development delays, but generally avoids early tactical traps.`
        : phaseName === 'Middlegame'
        ? `Handles standard positional setups reasonably well (${acc}% accuracy), with occasional slips during complex trades.`
        : `Steady handling of basic endgames (${acc}% accuracy), rarely throwing away games in low-material positions.`
    }
  }

  const opStatus = getPhaseMeta('Opening', opAcc, opBlunders, strongestPhase === 'Opening', weakestPhase === 'Opening')
  const midStatus = getPhaseMeta('Middlegame', midAcc, midBlunders, strongestPhase === 'Middlegame', weakestPhase === 'Middlegame')
  const endStatus = getPhaseMeta('Endgame', endAcc, endBlunders, strongestPhase === 'Endgame', weakestPhase === 'Endgame')

  // Tactical Leaks
  const tacticalLeaks = Object.entries(userBlunderPatterns)
    .map(([pattern, count]) => ({
      pattern,
      count,
      percentage: totalUserBlunders > 0 ? Math.round((count / totalUserBlunders) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)

  // Dynamic Strengths (genuine human chess coach assessment)
  const strengths: string[] = []
  if (strongestPhase === 'Opening' || opAcc >= 70) {
    strengths.push(`Opening Foundation (${opAcc}% avg accuracy) — builds consistent, playable setups right out of the opening.`)
  }
  if (strongestPhase === 'Endgame' || (endCount > 0 && endBlunders <= 12)) {
    strengths.push(`Endgame Composure (${endAcc}% accuracy, ${endBlunders} blunders) — stays disciplined in simplified positions.`)
  }
  if (whiteAccuracy >= blackAccuracy + 4) {
    strengths.push(`Initiative with White (${whiteAccuracy}% accuracy) — capitalizes on first-move tempo to dictate game flow.`)
  }
  if (winRate > 55) {
    strengths.push(`Winning Match Record (${winRate}% Win Rate) — consistently outplaying opponents across the 20-game window.`)
  } else if (winRate === 50) {
    strengths.push(`Competitive Parity (50% Win Rate) — evenly matched (${wins}W - ${losses}L); tightening tactical trades will tip the scale.`)
  } else if (wins > 0) {
    strengths.push(`Resilient Fighting Spirit — capable of finding counter-attacks and punishing opponent overextension.`)
  }
  if (strengths.length === 0) {
    strengths.push(`Patient positional play in quiet, structured positions.`)
  }

  // Dynamic Rating Leaks (clear, concrete human coach diagnosis)
  const weaknesses: string[] = []
  if (weakestPhase === 'Middlegame') {
    weaknesses.push(`Middlegame Tactics (${midAcc}% accuracy, ${midBlunders} blunders) — material lost during multi-piece exchanges between moves 13–30.`)
  } else if (weakestPhase === 'Opening') {
    weaknesses.push(`Opening Concessions (${opAcc}% accuracy, ${opBlunders} blunders) — falls behind in piece development or concedes central control before castling.`)
  } else {
    weaknesses.push(`Endgame Technique (${endAcc}% accuracy, ${endBlunders} blunders) — struggles to convert piece leads into winning king-and-pawn positions.`)
  }
  if (tacticalLeaks.length > 0) {
    weaknesses.push(`Frequent Pattern: ${tacticalLeaks[0].pattern} (${tacticalLeaks[0].percentage}% of blunders) — remember to verify undefended pieces before moving.`)
  }
  if (blackAccuracy < whiteAccuracy - 4) {
    weaknesses.push(`Black Repertoire (${blackAccuracy}% vs ${whiteAccuracy}% with White) — feels less comfortable playing defensively on the back foot.`)
  }
  if (weaknesses.length === 0) {
    weaknesses.push(`Occasional clock pressure leading to rushed moves in complex positions.`)
  }

  // Recommended Drills
  const recommendedDrills: { title: string; category: string; description: string; priority: 'high' | 'medium' }[] = []
  if (tacticalLeaks.length > 0 && tacticalLeaks[0].pattern.includes('Hanging')) {
    recommendedDrills.push({
      title: 'Blunder Check & Board Vision',
      category: 'Tactics',
      description: 'Perform a deliberate 3-second scan of all unprotected pieces before playing your candidate move.',
      priority: 'high'
    })
  }
  if (weakestPhase === 'Middlegame') {
    recommendedDrills.push({
      title: 'Middlegame Calculation & Tactics',
      category: 'Calculation',
      description: 'Practice 15 minutes of Puzzle Rush daily, emphasizing double attacks, pins, and discovered attacks.',
      priority: 'high'
    })
  } else if (weakestPhase === 'Opening') {
    recommendedDrills.push({
      title: 'Opening Principles & Development',
      category: 'Openings',
      description: 'Focus on rapid minor piece development, king safety (castling early), and controlling the center.',
      priority: 'high'
    })
  } else {
    recommendedDrills.push({
      title: 'Fundamental King & Pawn Endgames',
      category: 'Endgames',
      description: 'Master the concept of the opposition, passed pawns, and basic rook endgame drawing techniques.',
      priority: 'high'
    })
  }
  recommendedDrills.push({
    title: 'Opponent Prophylaxis',
    category: 'Strategy',
    description: "Ask yourself every move: 'What is my opponent threatening with their last move?'",
    priority: 'medium'
  })

  return {
    username,
    gamesPlayed: totalUserGames,
    wins,
    losses,
    draws,
    winRate,
    avgAccuracy,
    whiteAccuracy,
    blackAccuracy,
    whiteGames: whiteCount,
    blackGames: blackCount,
    phases: {
      opening: {
        accuracy: opAcc,
        blunders: opBlunders,
        movesCount: opCount,
        status: opStatus.status,
        statusLabel: opStatus.label,
        summary: opStatus.status === 'strong' ? 'High accuracy, strong central control' : 'Occasional inaccuracy during opening development'
      },
      middlegame: {
        accuracy: midAcc,
        blunders: midBlunders,
        movesCount: midCount,
        status: midStatus.status,
        statusLabel: midStatus.label,
        summary: midStatus.status === 'weak' ? 'Primary rating leak: tactical calculation errors' : 'Maintains piece coordination and attacks'
      },
      endgame: {
        accuracy: endAcc,
        blunders: endBlunders,
        movesCount: endCount,
        status: endStatus.status,
        statusLabel: endStatus.label,
        summary: endStatus.status === 'strong' ? 'Reliable conversion and king activity' : 'Pawn structure and endgame conversion need practice'
      },
      strongestPhase,
      weakestPhase
    },
    strengths,
    weaknesses,
    tacticalLeaks,
    recommendedDrills,
    recent20Games: userMatches
  }
}

export function calculateAggregateStats(games: AnalyzedGameRecord[], userAccountOverride?: string): AggregateStats {
  const activeUser = userAccountOverride !== undefined ? userAccountOverride : getUserAccount()
  const userStats = calculateUserAccountStats(games, activeUser)

  if (games.length === 0) {
    return {
      totalGames: 0,
      avgElo: 1500,
      avgAcplLast20: 0,
      avgAccuracy: 0,
      trendData: [],
      topBlunderPattern: null,
      studyNextNudge: 'Analyze games to discover your tactical leaks, phase mastery, and personalized training focus.',
      userStats
    }
  }

  const last20 = games.slice(0, 20)

  // Elo calculation
  let eloSum = 0
  let eloCount = 0
  games.forEach((g) => {
    if (g.whiteElo && g.whiteElo > 0) {
      eloSum += g.whiteElo
      eloCount++
    }
    if (g.blackElo && g.blackElo > 0) {
      eloSum += g.blackElo
      eloCount++
    }
  })
  const avgElo = eloCount > 0 ? Math.round(eloSum / eloCount) : 1500

  // ACPL and Accuracy over last 20
  const totalAcpl = last20.reduce((acc, g) => acc + (g.whiteAcpl + g.blackAcpl) / 2, 0)
  const avgAcplLast20 = Math.round(totalAcpl / last20.length)

  const totalAcc = last20.reduce((acc, g) => acc + (g.whiteAccuracy + g.blackAccuracy) / 2, 0)
  const avgAccuracy = Math.round((totalAcc / last20.length) * 10) / 10

  // Trend data in chronological order (oldest to newest for the chart)
  const trendData = [...last20].reverse().map((g) => ({
    id: g.id,
    date: g.date,
    acpl: Math.round((g.whiteAcpl + g.blackAcpl) / 2),
    accuracy: Math.round(((g.whiteAccuracy + g.blackAccuracy) / 2) * 10) / 10
  }))

  // Aggregate blunder patterns
  const patternCounts: Record<string, number> = {}
  let totalBlunders = 0

  games.forEach((g) => {
    Object.entries(g.blunderPatterns || {}).forEach(([pat, count]) => {
      patternCounts[pat] = (patternCounts[pat] || 0) + count
      totalBlunders += count
    })
  })

  let topPattern: { pattern: string; count: number; percentage: number } | null = null
  let maxCount = 0
  Object.entries(patternCounts).forEach(([pattern, count]) => {
    if (count > maxCount) {
      maxCount = count
      topPattern = {
        pattern,
        count,
        percentage: totalBlunders > 0 ? Math.round((count / totalBlunders) * 100) : 0
      }
    }
  })

  // Generate plain-text "Study this next" nudge based on empirical loss
  let studyNextNudge = ''
  const currentTop = topPattern as { pattern: string; count: number; percentage: number } | null
  if (currentTop && currentTop.pattern === 'Hanging Piece') {
    studyNextNudge = `Board vision priority: ${currentTop.percentage}% of blunders come from hanging undefended pieces. Scan all unprotected pieces before playing your candidate move.`
  } else if (currentTop && currentTop.pattern === 'Missed Fork') {
    studyNextNudge = `Tactical alert: Frequent missed double attacks and knight forks. Practice 15 minutes of knight fork tactics daily.`
  } else if (currentTop && currentTop.pattern === 'Allowed Checkmate') {
    studyNextNudge = `King safety crisis: Opponent back-rank or mating threats are going unnoticed. Always create an escape square (luft) before attacking.`
  } else if (currentTop && currentTop.pattern === 'Unfavorable Trade') {
    studyNextNudge = `Piece valuation: Losing exchanges by trading active pieces for passive opponent material.`
  } else if (avgAcplLast20 > 50) {
    studyNextNudge = `Middlegame calculation: Average loss of ${avgAcplLast20} cp indicates tactical instability. Calculate candidate moves 2 plies deeper.`
  } else {
    studyNextNudge = `Solid play: Your average centipawn loss (${avgAcplLast20} cp) is master-grade. Focus on opening transition plans.`
  }

  return {
    totalGames: games.length,
    avgElo,
    avgAcplLast20,
    avgAccuracy,
    trendData,
    topBlunderPattern: topPattern,
    studyNextNudge,
    userStats
  }
}
