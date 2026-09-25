import { parsePgn } from '../lib/pgnParser'
import { stockfishEngine } from './stockfishWorker'
import { classifySingleMove, isBookPosition, identifyOpening, aggregateGameAccuracy } from './classifyMove'
import { evaluateStaticFen } from './simpleEvaluator'
import type { AnalyzedGameRecord, GamePhaseData } from '../lib/progressStore'

export async function analyzePgnGame(
  pgn: string,
  onProgress?: (ply: number, totalPlies: number) => void,
  shouldCancel?: () => boolean
): Promise<AnalyzedGameRecord | null> {
  const parsedGame = parsePgn(pgn)
  if (parsedGame.moves.length === 0) return null

  const updatedMoves = [...parsedGame.moves]
  let prevEval = 20
  let prevBestMoveLan: string | undefined = undefined

  try {
    const initialRes = await stockfishEngine.evaluateFen(parsedGame.initialFen, 10)
    prevEval = initialRes.eval
    prevBestMoveLan = initialRes.bestMoveLan
  } catch {
    prevEval = 20
  }

  const blunderPatterns: Record<string, number> = {}
  const whiteBlunderPatterns: Record<string, number> = {}
  const blackBlunderPatterns: Record<string, number> = {}

  let whiteBlunders = 0, blackBlunders = 0, whiteMistakes = 0, blackMistakes = 0
  let whiteInaccuracies = 0, blackInaccuracies = 0, whiteLossSum = 0, blackLossSum = 0

  for (let i = 0; i < updatedMoves.length; i++) {
    if (shouldCancel && shouldCancel()) return null
    const move = updatedMoves[i]
    const isBook = isBookPosition(move.fenAfter)
    const evalRes = await stockfishEngine.evaluateFen(move.fenAfter, 10)
    const currentEval = evalRes.eval

    const classification = classifySingleMove(move, prevEval, currentEval, prevBestMoveLan, isBook)
    move.eval = currentEval
    move.mate = evalRes.mate
    move.bestMoveLan = evalRes.bestMoveLan
    move.bestMoveSan = classification.bestMoveSan
    move.classification = classification.classification
    move.moveAccuracy = classification.moveAccuracy
    move.winLoss = classification.winLoss
    move.explanation = classification.explanation
    move.tacticalPattern = classification.tacticalPattern
    move.isCritical = classification.isCritical

    if (move.color === 'w') {
      whiteLossSum += classification.evalLoss
      if (move.classification === 'blunder') {
        whiteBlunders++
        if (move.tacticalPattern) {
          whiteBlunderPatterns[move.tacticalPattern] = (whiteBlunderPatterns[move.tacticalPattern] || 0) + 1
        }
      }
      if (move.classification === 'mistake') whiteMistakes++
      if (move.classification === 'inaccuracy') whiteInaccuracies++
    } else {
      blackLossSum += classification.evalLoss
      if (move.classification === 'blunder') {
        blackBlunders++
        if (move.tacticalPattern) {
          blackBlunderPatterns[move.tacticalPattern] = (blackBlunderPatterns[move.tacticalPattern] || 0) + 1
        }
      }
      if (move.classification === 'mistake') blackMistakes++
      if (move.classification === 'inaccuracy') blackInaccuracies++
    }

    if (move.classification === 'blunder' && move.tacticalPattern) {
      blunderPatterns[move.tacticalPattern] = (blunderPatterns[move.tacticalPattern] || 0) + 1
    }

    prevEval = currentEval
    prevBestMoveLan = evalRes.bestMoveLan

    if (onProgress) {
      onProgress(i + 1, updatedMoves.length)
    }
  }

  const whiteMovesList = updatedMoves.filter((m) => m.color === 'w')
  const blackMovesList = updatedMoves.filter((m) => m.color === 'b')
  const whiteCount = whiteMovesList.length || 1
  const blackCount = blackMovesList.length || 1
  const whiteAcpl = Math.round(whiteLossSum / whiteCount)
  const blackAcpl = Math.round(blackLossSum / blackCount)

  const whiteAccuracies = whiteMovesList.map((m) => m.moveAccuracy ?? 75)
  const blackAccuracies = blackMovesList.map((m) => m.moveAccuracy ?? 75)
  const whiteAccuracy = whiteMovesList.length > 0 ? aggregateGameAccuracy(whiteAccuracies) : 75
  const blackAccuracy = blackMovesList.length > 0 ? aggregateGameAccuracy(blackAccuracies) : 75

  const computePhaseData = (mList: typeof updatedMoves): GamePhaseData => {
    const op = mList.filter((m) => m.moveNumber <= 12)
    const mid = mList.filter((m) => m.moveNumber > 12 && m.moveNumber <= 30)
    const end = mList.filter((m) => m.moveNumber > 30)

    const calcAcc = (arr: typeof updatedMoves) => {
      if (arr.length === 0) return 0
      const accuracies = arr.map((m) => m.moveAccuracy ?? 75)
      return aggregateGameAccuracy(accuracies)
    }

    return {
      openingAcc: calcAcc(op),
      middlegameAcc: calcAcc(mid),
      endgameAcc: calcAcc(end),
      openingBlunders: op.filter((m) => m.classification === 'blunder').length,
      middlegameBlunders: mid.filter((m) => m.classification === 'blunder').length,
      endgameBlunders: end.filter((m) => m.classification === 'blunder').length,
      openingCount: op.length,
      middlegameCount: mid.length,
      endgameCount: end.length
    }
  }

  return {
    id: `${parsedGame.metadata.white}-${parsedGame.metadata.black}-${parsedGame.metadata.date || Date.now()}`,
    date: parsedGame.metadata.date || new Date().toISOString().slice(0, 10),
    white: parsedGame.metadata.white,
    black: parsedGame.metadata.black,
    whiteElo: parsedGame.metadata.whiteElo ? parseInt(parsedGame.metadata.whiteElo, 10) : undefined,
    blackElo: parsedGame.metadata.blackElo ? parseInt(parsedGame.metadata.blackElo, 10) : undefined,
    result: parsedGame.metadata.result,
    eco: parsedGame.ecoCode || 'A00',
    opening: parsedGame.openingName || 'Opening',
    whiteAccuracy,
    blackAccuracy,
    whiteAcpl,
    blackAcpl,
    whiteBlunders,
    blackBlunders,
    whiteMistakes,
    blackMistakes,
    whiteInaccuracies,
    blackInaccuracies,
    blunderPatterns,
    whiteBlunderPatterns,
    blackBlunderPatterns,
    whitePhases: computePhaseData(whiteMovesList),
    blackPhases: computePhaseData(blackMovesList)
  }
}

/**
 * Super-fast full game analyzer (~50ms per game) using static positional evaluation and rules.
 * Allows analyzing 20 games in ~1 second, ideal for maintaining the 20-game FIFO window.
 */
export function analyzeGameRecordFast(
  pgn: string,
  externalAccuracies?: { white?: number; black?: number },
  customId?: string
): AnalyzedGameRecord | null {
  const parsedGame = parsePgn(pgn)
  if (parsedGame.moves.length === 0) return null

  const detected = identifyOpening(parsedGame.moves)
  const openingName = parsedGame.metadata.opening || detected.name
  const ecoCode = parsedGame.metadata.eco || detected.eco

  let prevEval = 20
  let prevBestMoveLan: string | undefined = undefined

  const blunderPatterns: Record<string, number> = {}
  const whiteBlunderPatterns: Record<string, number> = {}
  const blackBlunderPatterns: Record<string, number> = {}

  let whiteBlunders = 0, blackBlunders = 0, whiteMistakes = 0, blackMistakes = 0
  let whiteInaccuracies = 0, blackInaccuracies = 0, whiteLossSum = 0, blackLossSum = 0

  const moves = parsedGame.moves
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    const isBook = isBookPosition(move.fenAfter)
    const evalRes = evaluateStaticFen(move.fenAfter)
    const currentEval = evalRes.eval

    const classification = classifySingleMove(move, prevEval, currentEval, prevBestMoveLan, isBook)
    move.eval = currentEval
    move.bestMoveLan = evalRes.bestMoveLan
    move.bestMoveSan = classification.bestMoveSan
    move.classification = classification.classification
    move.moveAccuracy = classification.moveAccuracy
    move.winLoss = classification.winLoss
    move.explanation = classification.explanation
    move.tacticalPattern = classification.tacticalPattern
    move.isCritical = classification.isCritical

    if (move.color === 'w') {
      whiteLossSum += classification.evalLoss
      if (move.classification === 'blunder') {
        whiteBlunders++
        if (move.tacticalPattern) {
          whiteBlunderPatterns[move.tacticalPattern] = (whiteBlunderPatterns[move.tacticalPattern] || 0) + 1
        }
      }
      if (move.classification === 'mistake') whiteMistakes++
      if (move.classification === 'inaccuracy') whiteInaccuracies++
    } else {
      blackLossSum += classification.evalLoss
      if (move.classification === 'blunder') {
        blackBlunders++
        if (move.tacticalPattern) {
          blackBlunderPatterns[move.tacticalPattern] = (blackBlunderPatterns[move.tacticalPattern] || 0) + 1
        }
      }
      if (move.classification === 'mistake') blackMistakes++
      if (move.classification === 'inaccuracy') blackInaccuracies++
    }

    if (move.classification === 'blunder' && move.tacticalPattern) {
      blunderPatterns[move.tacticalPattern] = (blunderPatterns[move.tacticalPattern] || 0) + 1
    }

    prevEval = currentEval
    prevBestMoveLan = evalRes.bestMoveLan
  }

  const whiteMovesList = moves.filter((m) => m.color === 'w')
  const blackMovesList = moves.filter((m) => m.color === 'b')
  const whiteCount = whiteMovesList.length || 1
  const blackCount = blackMovesList.length || 1
  const whiteAcpl = Math.round(whiteLossSum / whiteCount)
  const blackAcpl = Math.round(blackLossSum / blackCount)

  const calcMoveAcc = (list: typeof moves) => {
    if (list.length === 0) return 75
    const accuracies = list.map((m) => m.moveAccuracy ?? 75)
    return aggregateGameAccuracy(accuracies)
  }

  const whiteAccuracy = externalAccuracies?.white !== undefined
    ? Math.round(externalAccuracies.white * 10) / 10
    : calcMoveAcc(whiteMovesList)

  const blackAccuracy = externalAccuracies?.black !== undefined
    ? Math.round(externalAccuracies.black * 10) / 10
    : calcMoveAcc(blackMovesList)

  const computePhaseData = (mList: typeof moves): GamePhaseData => {
    const op = mList.filter((m) => m.moveNumber <= 12)
    const mid = mList.filter((m) => m.moveNumber > 12 && m.moveNumber <= 30)
    const end = mList.filter((m) => m.moveNumber > 30)

    const calcPhaseAcc = (arr: typeof moves) => {
      if (arr.length === 0) return 0
      const accuracies = arr.map((m) => m.moveAccuracy ?? 75)
      return aggregateGameAccuracy(accuracies)
    }

    return {
      openingAcc: calcPhaseAcc(op),
      middlegameAcc: calcPhaseAcc(mid),
      endgameAcc: calcPhaseAcc(end),
      openingBlunders: op.filter((m) => m.classification === 'blunder').length,
      middlegameBlunders: mid.filter((m) => m.classification === 'blunder').length,
      endgameBlunders: end.filter((m) => m.classification === 'blunder').length,
      openingCount: op.length,
      middlegameCount: mid.length,
      endgameCount: end.length
    }
  }

  return {
    id: customId || `${parsedGame.metadata.white}-${parsedGame.metadata.black}-${parsedGame.metadata.date || Date.now()}`,
    date: parsedGame.metadata.date || new Date().toISOString().slice(0, 10),
    white: parsedGame.metadata.white,
    black: parsedGame.metadata.black,
    whiteElo: parsedGame.metadata.whiteElo ? parseInt(parsedGame.metadata.whiteElo, 10) : undefined,
    blackElo: parsedGame.metadata.blackElo ? parseInt(parsedGame.metadata.blackElo, 10) : undefined,
    result: parsedGame.metadata.result,
    eco: ecoCode,
    opening: openingName,
    whiteAccuracy,
    blackAccuracy,
    whiteAcpl,
    blackAcpl,
    whiteBlunders,
    blackBlunders,
    whiteMistakes,
    blackMistakes,
    whiteInaccuracies,
    blackInaccuracies,
    blunderPatterns,
    whiteBlunderPatterns,
    blackBlunderPatterns,
    whitePhases: computePhaseData(whiteMovesList),
    blackPhases: computePhaseData(blackMovesList),
    pgn
  }
}

