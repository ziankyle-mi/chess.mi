import type { ParsedMove } from './pgnParser'

export interface PlayerGameReport {
  playerColor: 'w' | 'b'
  username: string
  baseElo?: number
  gameRating: number // estimated performance Elo (e.g. 1050)
  accuracy: number // e.g. 91.2
  acpl: number
  brilliantCount: number
  greatCount: number
  bestCount: number
  bookCount: number
  inaccuracyCount: number
  mistakeCount: number
  missCount: number
  blunderCount: number
}

export interface FullGameReviewReport {
  white: PlayerGameReport
  black: PlayerGameReport
  evalTimeline: { moveNumber: number; ply: number; eval: number; classification?: string }[]
  totalMoves: number
}

function calcAcpl(moves: ParsedMove[]): number {
  if (moves.length === 0) return 0
  let totalLoss = 0
  let validCount = 0

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i]
    if (m.eval !== undefined) {
      const prevEval = i > 0 && moves[i - 1].eval !== undefined ? moves[i - 1].eval! : 20
      const loss = m.color === 'w' ? Math.max(0, prevEval - m.eval) : Math.max(0, m.eval - prevEval)
      totalLoss += loss
      validCount++
    }
  }

  return validCount > 0 ? Math.round(totalLoss / validCount) : 0
}

/**
 * Standard classification accuracy mappings matching Chess.com CAPS2
 */
export function getAccuracyForClassification(cls?: string): number {
  switch (cls) {
    case 'book': return 100
    case 'best': return 100
    case 'brilliant': return 100
    case 'great': return 96
    case 'excellent': return 94
    case 'good': return 88
    case 'inaccuracy': return 75
    case 'mistake': return 50
    case 'miss': return 35
    case 'blunder': return 20
    default: return 80
  }
}

/**
 * Calculates per-move accuracy ensuring Best/Book are always 100%
 */
export function getAccuracyForMove(move: ParsedMove): number {
  if (move.classification === 'best' || move.classification === 'book' || move.classification === 'brilliant') {
    return 100
  }
  if (typeof move.moveAccuracy === 'number' && move.moveAccuracy > 0) {
    return move.moveAccuracy
  }
  return getAccuracyForClassification(move.classification)
}

/**
 * Calculates CAPS2 game accuracy: direct average of move accuracies.
 */
export function calcCapsAccuracy(moves: ParsedMove[]): number {
  if (moves.length === 0) return 75
  const sum = moves.reduce((acc, m) => acc + getAccuracyForMove(m), 0)
  return Math.min(100, Math.max(5, Math.round((sum / moves.length) * 10) / 10))
}

export function computePerformanceRating(accuracy: number, _acpl: number, baseElo?: number): number {
  if (baseElo && baseElo > 0) {
    // Expected accuracy for this rating tier:
    // 500 Elo -> ~55%, 1000 Elo -> ~70%, 1500 Elo -> ~80%, 2000 Elo -> ~88%
    const expectedAcc = Math.min(94, Math.max(50, 52 + (baseElo / 100) * 1.8))
    const accDelta = accuracy - expectedAcc
    // ~15 rating points per 1% accuracy deviation from expectations
    const performance = Math.round(baseElo + accDelta * 15)
    return Math.max(300, Math.min(3100, Math.round(performance / 25) * 25))
  }

  // Without base Elo: calibrate by accuracy tiers
  let est = 400
  if (accuracy >= 97) est = 2500 + (accuracy - 97) * 150
  else if (accuracy >= 90) est = 1900 + (accuracy - 90) * 80
  else if (accuracy >= 80) est = 1400 + (accuracy - 80) * 50
  else if (accuracy >= 70) est = 1050 + (accuracy - 70) * 35
  else if (accuracy >= 60) est = 750 + (accuracy - 60) * 30
  else est = Math.max(350, Math.round(350 + accuracy * 6.5))

  return Math.max(300, Math.min(3100, Math.round(est / 25) * 25))
}

export function generateGameReviewReport(
  moves: ParsedMove[],
  whitePlayer: string,
  blackPlayer: string,
  whiteElo?: number,
  blackElo?: number,
  _openingName?: string
): FullGameReviewReport {
  const whiteMoves = moves.filter((m) => m.color === 'w')
  const blackMoves = moves.filter((m) => m.color === 'b')

  const whiteAcpl = calcAcpl(whiteMoves)
  const blackAcpl = calcAcpl(blackMoves)

  // Pure CAPS2 accuracy
  const whiteAcc = calcCapsAccuracy(whiteMoves)
  const blackAcc = calcCapsAccuracy(blackMoves)

  const countMoves = (mList: ParsedMove[], type: string) =>
    mList.filter((m) => m.classification === type).length

  const whiteReport: PlayerGameReport = {
    playerColor: 'w',
    username: whitePlayer,
    baseElo: whiteElo,
    gameRating: computePerformanceRating(whiteAcc, whiteAcpl, whiteElo),
    accuracy: whiteAcc,
    acpl: whiteAcpl,
    brilliantCount: countMoves(whiteMoves, 'brilliant'),
    greatCount: countMoves(whiteMoves, 'great') + countMoves(whiteMoves, 'excellent'),
    bestCount: countMoves(whiteMoves, 'best'),
    bookCount: countMoves(whiteMoves, 'book'),
    inaccuracyCount: countMoves(whiteMoves, 'inaccuracy'),
    mistakeCount: countMoves(whiteMoves, 'mistake'),
    missCount: countMoves(whiteMoves, 'miss'),
    blunderCount: countMoves(whiteMoves, 'blunder')
  }

  const blackReport: PlayerGameReport = {
    playerColor: 'b',
    username: blackPlayer,
    baseElo: blackElo,
    gameRating: computePerformanceRating(blackAcc, blackAcpl, blackElo),
    accuracy: blackAcc,
    acpl: blackAcpl,
    brilliantCount: countMoves(blackMoves, 'brilliant'),
    greatCount: countMoves(blackMoves, 'great') + countMoves(blackMoves, 'excellent'),
    bestCount: countMoves(blackMoves, 'best'),
    bookCount: countMoves(blackMoves, 'book'),
    inaccuracyCount: countMoves(blackMoves, 'inaccuracy'),
    mistakeCount: countMoves(blackMoves, 'mistake'),
    missCount: countMoves(blackMoves, 'miss'),
    blunderCount: countMoves(blackMoves, 'blunder')
  }

  // Eval timeline for the mini graph
  let lastKnownEval = 20
  const evalTimeline = moves.map((m, idx) => {
    if (m.eval !== undefined) {
      lastKnownEval = m.eval
    }
    return {
      moveNumber: Math.floor(idx / 2) + 1,
      ply: idx + 1,
      eval: Math.max(-1000, Math.min(1000, lastKnownEval)),
      classification: m.classification
    }
  })

  return {
    white: whiteReport,
    black: blackReport,
    evalTimeline,
    totalMoves: moves.length
  }
}
