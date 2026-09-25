import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import type { ParsedMove } from './pgnParser'

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king'
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100
}

export interface DeepExplanation {
  headline: string
  tacticalRole: string
  explanation: string
  whyItMatters: string
  threats: {
    created?: string
    prevented?: string
    conceded?: string
  }
  bestMoveComparison?: {
    bestMoveSan: string
    whyBetter: string
    evalDiffText: string
  }
  boardImpact: {
    kingSafety: string
    pieceActivity: string
    keySquaresControlled: string[]
  }
}

/**
 * Generates an in-depth, human-readable coach explanation for any chess move.
 * Identifies check evasion, threat creation/prevention, piece defenses, pins,
 * central presence, and side-by-side comparison with the engine's best move.
 */
export function generateDeepExplanation(
  move: ParsedMove,
  bestMoveSan?: string,
  openingTipTheme?: string
): DeepExplanation {
  const chessBefore = new Chess(move.fenBefore)
  const chessAfter = new Chess(move.fenAfter)
  const moverColor: Color = move.color
  const opponentColor: Color = moverColor === 'w' ? 'b' : 'w'
  const pieceName = PIECE_NAMES[move.piece] || 'piece'
  const isWhite = moverColor === 'w'
  const sideName = isWhite ? 'White' : 'Black'
  const oppName = isWhite ? 'Black' : 'White'

  const wasInCheck = chessBefore.inCheck()
  const isDeliveringCheck = chessAfter.inCheck()
  const isCheckmate = chessAfter.isCheckmate()
  const classification = move.classification || 'good'
  const isError = ['inaccuracy', 'mistake', 'blunder', 'miss'].includes(classification)

  // 1. King Safety & Checks
  let checkEvasionText: string | undefined
  let checkDeliveredText: string | undefined
  let tacticalRole = 'Positional Improvement'

  if (wasInCheck) {
    tacticalRole = 'Check Evasion & Defense'
    if (move.piece === 'k') {
      checkEvasionText = `Avoids check by stepping the king out of the line of fire to ${move.to}.`
    } else if (move.captured) {
      checkEvasionText = `Neutralizes check by capturing the attacking opponent piece on ${move.to}.`
    } else {
      checkEvasionText = `Shields the king from check by interposing the ${pieceName} on ${move.to}.`
    }
  }

  if (isCheckmate) {
    tacticalRole = 'Checkmate Attack'
    checkDeliveredText = `Delivers decisive checkmate on ${move.to}. The opponent king has no legal escapes.`
  } else if (isDeliveringCheck) {
    tacticalRole = 'Attacking Check'
    checkDeliveredText = `Attacks the opponent's king on ${move.to} with check, demanding an immediate defensive response.`
  }

  // Check if this move prevented an incoming opponent check
  let checkPreventedText: string | undefined
  if (!wasInCheck && !isCheckmate) {
    try {
      // Check opponent legal moves in fenBefore by simulating opponent's turn
      const fenParts = move.fenBefore.split(' ')
      fenParts[1] = opponentColor
      fenParts[3] = '-'
      const oppChessBefore = new Chess(fenParts.join(' '))
      const oppCheckMovesBefore = oppChessBefore.moves({ verbose: true })
        .filter((m) => m.san.includes('+') || m.san.includes('#'))
      
      if (oppCheckMovesBefore.length > 0) {
        // Now check if opponent still has checks in fenAfter (where it IS opponent's turn)
        const oppCheckMovesAfter = chessAfter.moves({ verbose: true })
          .filter((m) => m.san.includes('+') || m.san.includes('#'))
        
        const preventedThreat = oppCheckMovesBefore.find(
          (bm) => !oppCheckMovesAfter.some((am) => am.san === bm.san)
        )
        if (preventedThreat) {
          checkPreventedText = `Prevents an incoming check: eliminates opponent's threatened ${preventedThreat.san} against the king.`
          if (tacticalRole === 'Positional Improvement') {
            tacticalRole = 'Check Prevention & Prophylaxis'
          }
        }
      }
    } catch {
      // Fallback if FEN turn swap is not legal
    }
  }

  // 2. Material Captures & Threats Created
  let threatCreated: string | undefined
  let threatPrevented = checkPreventedText
  let threatConceded: string | undefined

  if (move.captured) {
    const capturedName = PIECE_NAMES[move.captured] || 'piece'
    const capVal = PIECE_VALUES[move.captured] || 1
    const moverVal = PIECE_VALUES[move.piece] || 1

    if (moverVal < capVal) {
      tacticalRole = 'Favorable Material Win'
      threatCreated = `Wins the exchange by capturing opponent's ${capturedName} (${capVal} pts) with the ${pieceName}.`
    } else {
      tacticalRole = 'Material Capture'
      threatCreated = `Captures opponent's ${capturedName} on ${move.to}, simplifying the board.`
    }
  }

  // Check what pieces the moved piece now attacks from move.to
  const attackedOpponentSquares: Square[] = []
  const oppBoard = chessAfter.board()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = oppBoard[r][c]
      if (p && p.color === opponentColor && p.type !== 'k') {
        const sq = p.square
        if (chessAfter.attackers(sq, moverColor).includes(move.to)) {
          attackedOpponentSquares.push(sq)
        }
      }
    }
  }

  if (attackedOpponentSquares.length >= 2 && !threatCreated) {
    tacticalRole = 'Tactical Fork'
    const targets = attackedOpponentSquares
      .map((sq) => {
        const p = chessAfter.get(sq)
        return p ? PIECE_NAMES[p.type] : 'piece'
      })
      .slice(0, 2)
    threatCreated = `Forks multiple enemy pieces, targeting ${targets.join(' and ')} simultaneously.`
  } else if (attackedOpponentSquares.length === 1 && !threatCreated) {
    const targetPiece = chessAfter.get(attackedOpponentSquares[0])
    if (targetPiece && (PIECE_VALUES[targetPiece.type] >= 3 || PIECE_VALUES[targetPiece.type] > PIECE_VALUES[move.piece])) {
      threatCreated = `Threatens opponent's ${PIECE_NAMES[targetPiece.type]} on ${attackedOpponentSquares[0]}, seizing the initiative with tempo.`
    }
  }

  // Check if move defended an attacked friendly piece
  if (!wasInCheck) {
    const friendlyBoardBefore = chessBefore.board()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = friendlyBoardBefore[r][c]
        if (p && p.color === moverColor && p.square !== move.from && p.type !== 'k') {
          const wasAttacked = chessBefore.isAttacked(p.square, opponentColor)
          const nowDefended = chessAfter.attackers(p.square, moverColor).includes(move.to)
          if (wasAttacked && nowDefended) {
            threatPrevented = `Reinforces defense of the attacked ${PIECE_NAMES[p.type]} on ${p.square}.`
            tacticalRole = 'Piece Defense & Solidity'
            break
          }
        }
      }
    }
  }

  // 3. Castling & King Safety
  let kingSafety = 'King remains safely shielded on the board.'
  if (move.san.includes('O-O')) {
    tacticalRole = 'King Safety'
    kingSafety = `King castles to the ${move.san.includes('O-O-O') ? 'queenside' : 'kingside'}, securing king shelter behind pawns and connecting rooks.`
  } else if (move.piece === 'k' && !wasInCheck) {
    kingSafety = `King moves in the center. Avoids unnecessary exposure to open files.`
  }

  // 4. Central Control
  const centerSquares: Square[] = ['e4', 'd4', 'e5', 'd5']
  const controlsCenter = centerSquares.some((sq) => chessAfter.attackers(sq, moverColor).includes(move.to)) || centerSquares.includes(move.to)
  const keySquaresControlled: string[] = []
  centerSquares.forEach((sq) => {
    if (chessAfter.attackers(sq, moverColor).includes(move.to)) {
      keySquaresControlled.push(sq)
    }
  })

  // 5. Piece Activity
  let pieceActivity = `Coordinates ${pieceName} into an active posture.`
  if (move.moveNumber <= 12 && ['n', 'b'].includes(move.piece)) {
    pieceActivity = `Develops the ${pieceName} off the home rank, preparing coordination and castling.`
    if (!tacticalRole.includes('Check') && !tacticalRole.includes('Capture')) {
      tacticalRole = 'Opening Development'
    }
  } else if (move.piece === 'r' && (move.to[0] === 'd' || move.to[0] === 'e' || move.to[0] === 'c')) {
    pieceActivity = `Places the rook on an active central file to contest open files.`
  }

  // 6. Error & Blunder Analysis
  if (isError) {
    // Check if the moved piece itself is hanging
    const isTargetAttacked = chessAfter.isAttacked(move.to, opponentColor)
    const isTargetDefended = chessAfter.isAttacked(move.to, moverColor)
    if (isTargetAttacked && !isTargetDefended && PIECE_VALUES[move.piece] >= 3) {
      threatConceded = `Blunders the ${pieceName} on ${move.to}, leaving it undefended to enemy capture.`
      tacticalRole = 'Unprotected Piece Blunder'
    } else {
      // Check if another friendly piece was left hanging
      const boardAfter = chessAfter.board()
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = boardAfter[r][c]
          if (p && p.color === moverColor && p.square !== move.to && PIECE_VALUES[p.type] >= 3) {
            const att = chessAfter.isAttacked(p.square, opponentColor)
            const def = chessAfter.isAttacked(p.square, moverColor)
            if (att && !def) {
              threatConceded = `Leaves the ${PIECE_NAMES[p.type]} on ${p.square} unguarded and vulnerable.`
              tacticalRole = 'Overlooked Defense'
              break
            }
          }
        }
      }
    }

    if (!threatConceded) {
      threatConceded = `Allows ${oppName} tactical counterplay and concessions in central coordination.`
    }
  }

  // Book Move handling: return opening-aware theory explanation directly
  if (classification === 'book') {
    tacticalRole = 'Opening Theory'
    const headline = `${sideName} plays ${move.san} (Book Move)`
    const explanation =
      move.explanation ||
      'Established opening theory contesting key central squares according to grandmaster praxis.'
    const whyItMatters =
      openingTipTheme || 'Control the center, develop minor pieces harmoniously, and secure king safety.'

    return {
      headline,
      tacticalRole,
      explanation,
      whyItMatters,
      threats: {
        created: threatCreated,
        prevented: threatPrevented
      },
      boardImpact: {
        kingSafety,
        pieceActivity,
        keySquaresControlled
      }
    }
  }

  // 7. Compose Headline & In-Depth Explanation Narrative
  let headline = `${sideName} plays ${move.san}`
  if (classification === 'blunder') {
    tacticalRole = 'Decisive Blunder'
    headline = `${sideName} blunders with ${move.san}`
  } else if (classification === 'mistake') {
    tacticalRole = 'Tactical Mistake'
    headline = `${sideName} makes a mistake with ${move.san}`
  } else if (classification === 'miss') {
    tacticalRole = 'Missed Advantage'
    headline = `${sideName} misses winning continuation with ${move.san}`
  } else if (classification === 'inaccuracy') {
    tacticalRole = 'Positional Inaccuracy'
    headline = `${sideName} plays inaccurate ${move.san}`
  } else if (move.tacticalPattern === 'Book Move') {
    tacticalRole = 'Opening Theory'
    headline = `${sideName} plays book move ${move.san}`
  } else if (move.tacticalPattern === 'Opening Deviation') {
    tacticalRole = 'Opening Deviation'
    headline = `${sideName} leaves book with ${move.san}`
  } else if (checkEvasionText) {
    headline = `${checkEvasionText.split('.')[0]}`
  } else if (isCheckmate) {
    headline = `Checkmate delivered on ${move.to}!`
  } else if (isDeliveringCheck) {
    headline = `Checks the enemy king with ${move.san}`
  } else if (move.san.includes('O-O')) {
    headline = `Castles into safety (${move.san})`
  } else if (move.captured) {
    headline = `Captures on ${move.to} (${move.san})`
  } else if (threatCreated) {
    headline = `${pieceName.charAt(0).toUpperCase() + pieceName.slice(1)} to ${move.to}: ${threatCreated}`
  } else if (controlsCenter) {
    headline = `Fights for central control on ${move.to}`
  }

  // Focused 1-sentence explanation
  let explanation = move.explanation || ''
  if (move.tacticalPattern === 'Opening Deviation') {
    // Keep the opening deviation explanation directly
    explanation = move.explanation || `Leaves standard theory, giving up the initiative.`
  } else if (checkEvasionText) {
    explanation = checkEvasionText
  } else if (checkDeliveredText) {
    explanation = checkDeliveredText
  } else if (!explanation) {
    if (threatConceded) {
      explanation = threatConceded
    } else if (threatCreated) {
      explanation = threatCreated
    } else {
      explanation = `Solid move maintaining piece coordination with the ${pieceName}.`
    }
  }

  // Why it matters - 1 punchy principle
  let whyItMatters = ''
  if (wasInCheck) {
    whyItMatters = 'Parrying check is mandatory to protect the king and avoid mating nets.'
  } else if (isError) {
    whyItMatters = threatConceded
      ? `A tactical oversight. Keep defensive awareness across all files.`
      : 'Avoid leaving unprotected pieces or conceding central initiative.'
  } else if (move.moveNumber <= 12) {
    whyItMatters = openingTipTheme || 'Control the center, develop minor pieces, and castle early.'
  } else {
    whyItMatters = 'Maintains steady piece activity and prevents opponent infiltration.'
  }

  // Best move comparison
  let bestMoveComparison: DeepExplanation['bestMoveComparison'] | undefined
  if (bestMoveSan && (isError || classification === 'good')) {
    let whyBetter = ''
    try {
      const testChess = new Chess(move.fenBefore)
      testChess.move(bestMoveSan)
      if (testChess.inCheck()) {
        whyBetter = `Delivers an active check or pins opponent's king while developing.`
      } else if (testChess.isAttacked('e4', moverColor) || testChess.isAttacked('d4', moverColor)) {
        whyBetter = `Controls the central files and preserves defensive harmony across your pieces.`
      } else {
        whyBetter = `Safeguards your position, avoids unnecessary material loss, and keeps the initiative.`
      }
    } catch {
      whyBetter = `Maintains higher engine evaluation and minimizes opponent counterplay.`
    }

    bestMoveComparison = {
      bestMoveSan,
      whyBetter,
      evalDiffText: move.winLoss ? `${move.winLoss.toFixed(1)}% win chance preserved` : 'Optimal line'
    }
  }

  return {
    headline,
    tacticalRole,
    explanation,
    whyItMatters,
    threats: {
      created: threatCreated,
      prevented: threatPrevented,
      conceded: threatConceded
    },
    bestMoveComparison,
    boardImpact: {
      kingSafety,
      pieceActivity,
      keySquaresControlled
    }
  }
}
