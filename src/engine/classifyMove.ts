import type { ParsedMove, MoveClassification } from '../lib/pgnParser'
import openingsData from '../data/openings.json'
import { detectTacticalPattern } from '../lib/patternDetection'
import { Chess } from 'chess.js'

const openingsDict = openingsData as Record<string, { eco: string; name: string }>

export function identifyOpening(moves: ParsedMove[]): { eco: string; name: string } {
  let matched = { eco: 'A00', name: 'Standard Opening' }

  // Check each position along the move history to find the deepest recognized book line
  for (let i = Math.min(moves.length - 1, 25); i >= 0; i--) {
    const fen = moves[i].fenAfter
    const key = fen.split(' ').slice(0, 3).join(' ')
    if (openingsDict[key]) {
      return openingsDict[key]
    }
  }

  // Check initial position
  if (moves.length > 0) {
    const key = moves[0].fenBefore.split(' ').slice(0, 3).join(' ')
    if (openingsDict[key]) return openingsDict[key]
  }

  return matched
}

export function isBookPosition(fen: string): boolean {
  const key = fen.split(' ').slice(0, 3).join(' ')
  return Boolean(openingsDict[key])
}

/**
 * STEP 1 — Convert position centipawn eval to win percentage (0 to 100%):
 * winPercent = 50 + 50 * (2 / (1 + exp(-0.00368208 * centipawns)) - 1)
 * Clamps centipawns to [-1000, 1000] so mate evals don't distort the sigmoid curve.
 */
export function cpToWinPercent(centipawns: number): number {
  const clampedCp = Math.max(-1000, Math.min(1000, centipawns))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clampedCp)) - 1)
}

/**
 * Backward compatibility alias
 */
export const cpToWinProb = cpToWinPercent

/**
 * STEP 2 — Calculate how much win percentage was lost:
 * winPercentLoss = winPercentBefore - winPercentAfter
 * (from the perspective of the player who just moved; if negative, clamp to 0)
 */
export function calcWinPercentLoss(evalBefore: number, evalAfter: number, color: 'w' | 'b'): number {
  const winBefore = color === 'w' ? cpToWinPercent(evalBefore) : 100 - cpToWinPercent(evalBefore)
  const winAfter = color === 'w' ? cpToWinPercent(evalAfter) : 100 - cpToWinPercent(evalAfter)
  return Math.max(0, winBefore - winAfter)
}

/**
 * Backward compatibility alias
 */
export const calcWinProbLoss = calcWinPercentLoss

/**
 * STEP 3 — Convert per-move loss into a per-move accuracy score:
 * moveAccuracy = 103.1668 * exp(-0.04354 * winPercentLoss) - 3.1669
 * Clamped between 0 and 100.
 */
export function winLossToMoveAccuracy(winPercentLoss: number): number {
  const clampedLoss = Math.max(0, winPercentLoss)
  const raw = 103.1668 * Math.exp(-0.04354 * clampedLoss) - 3.1669
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10))
}

/**
 * STEP 4 — Aggregate per-move accuracy into one game accuracy score:
 * Combines plain average with harmonic mean: (arithmeticMean + harmonicMean) / 2
 * This accounts for consistency and punishes low outliers (blunders/mistakes)
 * so that single game-losing mistakes are not buried by a quiet rest of the game.
 */
export function aggregateGameAccuracy(moveAccuracies: number[]): number {
  if (moveAccuracies.length === 0) return 100

  // 1. Plain arithmetic average
  const sum = moveAccuracies.reduce((acc, a) => acc + a, 0)
  const arithmeticMean = sum / moveAccuracies.length

  // 2. Harmonic mean: N / sum(1 / max(1, a_i))
  // Clamped to at least 1 to avoid division by zero
  const harmonicDenominator = moveAccuracies.reduce((denom, a) => denom + (1 / Math.max(1, a)), 0)
  const harmonicMean = harmonicDenominator > 0 ? moveAccuracies.length / harmonicDenominator : arithmeticMean

  // 3. Balanced combination punishing outliers
  const combined = (arithmeticMean + harmonicMean) / 2
  return Math.min(100, Math.max(0, Math.round(combined * 10) / 10))
}

export function classifySingleMove(
  move: ParsedMove,
  evalBefore: number,
  evalAfter: number,
  bestMoveLan?: string,
  isBook = false
): {
  classification: MoveClassification
  evalLoss: number
  winLoss: number
  moveAccuracy: number
  explanation: string
  tacticalPattern: string
  isCritical: boolean
  bestMoveSan?: string
} {
  // Convert bestMoveLan to SAN if possible
  let bestMoveSan: string | undefined
  if (bestMoveLan && bestMoveLan.length >= 4) {
    try {
      const chess = new Chess(move.fenBefore)
      const from = bestMoveLan.slice(0, 2)
      const to = bestMoveLan.slice(2, 4)
      const promotion = bestMoveLan.length > 4 ? bestMoveLan[4] : undefined
      const m = chess.move({ from, to, promotion: promotion as any })
      if (m) bestMoveSan = m.san
    } catch {
      // Ignore if LAN cannot be converted
    }
  }

  // Centipawns lost
  const rawLoss = move.color === 'w' ? evalBefore - evalAfter : evalAfter - evalBefore
  const evalLoss = Math.max(0, rawLoss)

  // STEP 2: Win percentage lost (0% to 100%)
  const winLoss = calcWinPercentLoss(evalBefore, evalAfter, move.color)

  // STEP 3: Per-move accuracy calculated directly from winPercentLoss
  let moveAccuracy = winLossToMoveAccuracy(winLoss)

  const playedLan = move.lan.toLowerCase()
  const engineLan = bestMoveLan?.toLowerCase()

  let classification: MoveClassification = 'good'

  // Consistent classification thresholds strictly derived from winPercentLoss:
  if (isBook && move.moveNumber <= 12) {
    classification = 'book'
    moveAccuracy = 100
  } else if (engineLan && playedLan === engineLan) {
    classification = 'best'
    moveAccuracy = 100
  } else if (winLoss <= 0.5) {
    classification = 'best'
    moveAccuracy = 100
  } else if (winLoss <= 2.0) {
    classification = 'great'
  } else if (winLoss <= 5.0) {
    classification = 'good'
  } else if (winLoss <= 12.0) {
    classification = 'inaccuracy'
  } else if (winLoss <= 25.0) {
    // If player had a decisive winning advantage and failed to find the tactic:
    const playerEvalBefore = move.color === 'w' ? evalBefore : -evalBefore
    if (playerEvalBefore >= 200) {
      classification = 'miss'
    } else {
      classification = 'mistake'
    }
  } else {
    classification = 'blunder'
  }

  // Critical moment detection: decisive win swing or sign flip across equality
  const isCritical =
    winLoss >= 20 ||
    (evalBefore > 120 && evalAfter < -80) ||
    (evalBefore < -120 && evalAfter > 80)

  // Plain-English explanation
  let patternResult = detectTacticalPattern(move, evalLoss, bestMoveSan, bestMoveLan)

  if (classification === 'book') {
    patternResult = {
      pattern: 'Book Move',
      explanation: 'Established opening theory contesting key central squares according to grandmaster praxis.'
    }
  }

  return {
    classification,
    evalLoss,
    winLoss,
    moveAccuracy,
    explanation: patternResult.explanation,
    tacticalPattern: patternResult.pattern,
    isCritical,
    bestMoveSan
  }
}
