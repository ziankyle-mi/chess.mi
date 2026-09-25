import type { ParsedMove, MoveClassification } from '../lib/pgnParser'
import openingsData from '../data/openings.json'
import { detectTacticalPattern } from '../lib/patternDetection'
import { isTheoryPosition, lookupTheoryMove } from './openingTheory'
import { Chess } from 'chess.js'

const openingsDict = openingsData as Record<string, { eco: string; name: string }>

export function identifyOpening(moves: ParsedMove[]): { eco: string; name: string } {
  let matched = { eco: 'A00', name: 'Standard Opening' }

  // Check each position along the move history to find the deepest recognized book line
  for (let i = Math.min(moves.length - 1, 25); i >= 0; i--) {
    const theoryRes = lookupTheoryMove(moves[i].fenBefore, moves[i].san, moves[i].fenAfter)
    if (theoryRes.openingName && theoryRes.openingName !== 'Opening Theory' && theoryRes.openingName !== 'Standard Opening') {
      return {
        eco: theoryRes.eco || 'A00',
        name: theoryRes.openingName
      }
    }

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
  return isTheoryPosition(fen)
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
 * Plain arithmetic average of move accuracies (matching Chess.com behavior).
 * Avoids harmonic mean over-penalizing occasional errors in otherwise strong games.
 */
export function aggregateGameAccuracy(moveAccuracies: number[]): number {
  if (moveAccuracies.length === 0) return 100
  const sum = moveAccuracies.reduce((acc, a) => acc + a, 0)
  return Math.min(100, Math.max(0, Math.round((sum / moveAccuracies.length) * 10) / 10))
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

  const isOpening = move.moveNumber <= 15
  const theoryResult = lookupTheoryMove(move.fenBefore, move.san, move.fenAfter)

  // A move is candidate Book ONLY if:
  // 1. It belongs to curated master theory (THEORY_LINES)
  // 2. It does NOT lose substantial evaluation (evalLoss <= 20 centipawns and winLoss <= 2.0%)
  // Extends book immunity up to move 20 for identified theory positions.
  const bookCutoff = theoryResult.isBook ? 20 : 15
  const isSoundTheory =
    (theoryResult.isBook || isBook) &&
    move.moveNumber <= bookCutoff &&
    evalLoss <= 20 &&
    winLoss <= 2.0

  // Phase-aware error thresholds (Chess.com style: lenient in opening)
  const inaccuracyWinLoss = move.moveNumber <= 10 ? 7.0 : move.moveNumber <= 20 ? 5.5 : 4.0
  const inaccuracyCp = move.moveNumber <= 10 ? 80 : move.moveNumber <= 20 ? 60 : 45
  const mistakeWinLoss = move.moveNumber <= 10 ? 14.0 : move.moveNumber <= 20 ? 11.0 : 8.5
  const mistakeCp = move.moveNumber <= 10 ? 150 : move.moveNumber <= 20 ? 120 : 90
  const blunderWinLoss = move.moveNumber <= 10 ? 25.0 : move.moveNumber <= 20 ? 21.0 : 18.0
  const blunderCp = move.moveNumber <= 10 ? 250 : move.moveNumber <= 20 ? 220 : 200

  // Tactical pattern detection
  let patternResult = detectTacticalPattern(move, evalLoss, bestMoveSan, bestMoveLan)
  const isHangingPieceBlunder = patternResult.pattern === 'Hanging Piece' && evalLoss >= 150
  const isCheckmateAllowed = patternResult.pattern === 'Allowed Checkmate'

  let classification: MoveClassification = 'good'

  // 1. Engine Top Choice
  if (engineLan && playedLan === engineLan) {
    classification = 'best'
    moveAccuracy = 100
  }
  // 2. Validated Sound Grandmaster Book Move
  else if (isSoundTheory) {
    classification = 'book'
    moveAccuracy = 100
  }
  // 3. Allowed Immediate Checkmate
  else if (isCheckmateAllowed) {
    classification = 'blunder'
    moveAccuracy = 0
  }
  // 4. Blunder (??): severe eval loss, hanging piece, or catastrophic collapse
  else if (isHangingPieceBlunder || winLoss >= blunderWinLoss || evalLoss >= blunderCp) {
    classification = 'blunder'
    moveAccuracy = Math.min(25, winLossToMoveAccuracy(winLoss))
  }
  // 5. Mistake (?) or Miss: substantial loss of 1-2 pawns or blowing a won game
  else if (winLoss >= mistakeWinLoss || evalLoss >= mistakeCp) {
    const playerEvalBefore = move.color === 'w' ? evalBefore : -evalBefore
    if (playerEvalBefore >= 200 && evalLoss >= 100) {
      classification = 'miss'
    } else {
      classification = 'mistake'
    }
  }
  // 6. Inaccuracy (?!): drop of roughly 45-90 centipawns (phase-aware)
  else if (winLoss >= inaccuracyWinLoss || evalLoss >= inaccuracyCp) {
    classification = 'inaccuracy'
  }
  // 7. Good: solid playable move (eval loss roughly 18-45 cp)
  else if (winLoss >= 1.8 || evalLoss >= 18) {
    classification = 'good'
  }
  // 8. Great / Excellent: close to the top move (eval loss roughly 8-18 cp)
  else if (winLoss > 0.6 || evalLoss > 8) {
    classification = 'great'
  }
  // 9. Best: within 8cp AND is the actual engine top move. Otherwise 'great'.
  // Prevents near-misses from getting the same stamp as a genuinely top move.
  else if (engineLan && playedLan === engineLan) {
    classification = 'best'
    moveAccuracy = 100
  } else {
    classification = 'great'
    moveAccuracy = winLossToMoveAccuracy(winLoss)
  }

  // Critical moment detection: decisive win swing or sign flip across equality
  const isCritical =
    winLoss >= 20 ||
    (evalBefore > 120 && evalAfter < -80) ||
    (evalBefore < -120 && evalAfter > 80)

  // Plain-English explanation refinement

  if (classification === 'book') {
    const bookExplanation =
      theoryResult.purpose ||
      (theoryResult.openingName
        ? `Established theory in the ${theoryResult.openingName} contesting key central squares.`
        : 'Established opening theory contesting key central squares according to grandmaster praxis.')
    patternResult = {
      pattern: 'Book Move',
      explanation: bookExplanation
    }
  } else if (
    isOpening &&
    theoryResult.deviation &&
    ['inaccuracy', 'mistake', 'blunder', 'miss'].includes(classification)
  ) {
    // Left known book with a suboptimal move - explain the deviation itself
    const dev = theoryResult.deviation
    const bookChoice = dev.recommendedMove
    const bookPurpose = dev.recommendedPurpose ? ` (${dev.recommendedPurpose})` : ''
    const consequence = patternResult.explanation
      ? patternResult.explanation.charAt(0).toLowerCase() + patternResult.explanation.slice(1).replace(/\.+$/, '')
      : 'concedes central harmony'

    patternResult = {
      pattern: 'Opening Deviation',
      explanation: `Deviates from standard ${dev.openingName} theory. The book move was ${bookChoice}${bookPurpose}. Playing ${move.san} leaves theory and ${consequence}.`
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
