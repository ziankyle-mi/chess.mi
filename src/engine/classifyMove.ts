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
 * Standard Chess.com / Lichess win probability function from centipawns:
 * Win% = 100 / (1 + e^(-0.00368208 * cp))
 */
export function cpToWinProb(cp: number): number {
  return 100 / (1 + Math.exp(-0.00368208 * cp))
}

/**
 * Calculates win percentage drop (0 to 100%) experienced by the player who moved.
 */
export function calcWinProbLoss(evalBefore: number, evalAfter: number, color: 'w' | 'b'): number {
  const winBefore = color === 'w' ? cpToWinProb(evalBefore) : 100 - cpToWinProb(evalBefore)
  const winAfter = color === 'w' ? cpToWinProb(evalAfter) : 100 - cpToWinProb(evalAfter)
  return Math.max(0, winBefore - winAfter)
}

/**
 * Chess.com CAPS2 move accuracy formula:
 * Accuracy = 103.1668 * e^(-0.04354 * winLoss) - 3.1669
 */
export function winLossToMoveAccuracy(winLoss: number): number {
  const acc = 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669
  return Math.min(100, Math.max(0, Math.round(acc * 10) / 10))
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

  // Win probability loss (Chess.com CAPS metric)
  const winLoss = calcWinProbLoss(evalBefore, evalAfter, move.color)
  let moveAccuracy = winLossToMoveAccuracy(winLoss)

  const playedLan = move.lan.toLowerCase()
  const engineLan = bestMoveLan?.toLowerCase()

  let classification: MoveClassification = 'good'

  // Win probability thresholds calibrated to Chess.com
  if (isBook && move.moveNumber <= 12) {
    classification = 'book'
    moveAccuracy = 100
  } else if (engineLan && playedLan === engineLan) {
    classification = 'best'
    moveAccuracy = 100
  } else if (winLoss <= 1.5) {
    classification = 'best'
    moveAccuracy = Math.max(98, moveAccuracy)
  } else if (winLoss <= 4.0) {
    classification = 'great'
    moveAccuracy = Math.max(95, moveAccuracy)
  } else if (winLoss <= 9.0) {
    classification = 'good'
    moveAccuracy = Math.max(88, moveAccuracy)
  } else if (winLoss <= 18.0) {
    classification = 'inaccuracy'
    moveAccuracy = Math.min(84, Math.max(65, moveAccuracy))
  } else if (winLoss <= 32.0) {
    // If player had a winning advantage and failed to find the tactic:
    const playerEvalBefore = move.color === 'w' ? evalBefore : -evalBefore
    if (playerEvalBefore >= 180) {
      classification = 'miss'
      moveAccuracy = Math.min(45, Math.max(25, moveAccuracy))
    } else {
      classification = 'mistake'
      moveAccuracy = Math.min(60, Math.max(35, moveAccuracy))
    }
  } else {
    classification = 'blunder'
    moveAccuracy = Math.min(30, Math.max(5, moveAccuracy))
  }

  // Critical moment detection:
  // Decisive swing (winLoss >= 25%) or sign flip across equality
  const isCritical =
    winLoss >= 22 ||
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
