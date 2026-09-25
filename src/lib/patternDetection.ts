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

export interface PatternResult {
  pattern: string
  explanation: string
}

export function detectTacticalPattern(
  move: ParsedMove,
  evalLoss: number, // positive number representing centipawn loss for the moving player
  bestMoveSan?: string,
  bestMoveLan?: string
): PatternResult {
  const chessBefore = new Chess(move.fenBefore)
  const chessAfter = new Chess(move.fenAfter)
  const playerColor = move.color
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w'
  const pieceName = PIECE_NAMES[move.piece] || 'piece'

  // 1. Checkmate allowed
  if (chessAfter.isCheckmate()) {
    return {
      pattern: 'Checkmate',
      explanation: `${playerColor === 'w' ? 'White' : 'Black'} delivers checkmate.`
    }
  }

  // Check if opponent can now mate in 1
  const oppMoves = chessAfter.moves({ verbose: true })
  const mateMove = oppMoves.find((m) => {
    chessAfter.move(m)
    const mated = chessAfter.isCheckmate()
    chessAfter.undo()
    return mated
  })

  if (mateMove) {
    return {
      pattern: 'Allowed Checkmate',
      explanation: `Allows opponent to deliver immediate checkmate with ${mateMove.san}.`
    }
  }

  // 2. Hanging piece blundered
  const targetSquare = move.to
  const attackedAfter = isSquareAttacked(chessAfter, targetSquare, opponentColor)
  const defendedAfter = isSquareAttacked(chessAfter, targetSquare, playerColor)

  if (evalLoss >= 250 && attackedAfter && !defendedAfter && PIECE_VALUES[move.piece] >= 3) {
    return {
      pattern: 'Hanging Piece',
      explanation: `Blunders the ${pieceName} on ${targetSquare}, leaving it undefended to opponent capture.`
    }
  }

  // Check if player left another piece hanging
  if (evalLoss >= 200) {
    const hangingPiece = findHangingPiece(chessAfter, playerColor)
    if (hangingPiece && hangingPiece.square !== targetSquare) {
      return {
        pattern: 'Hanging Piece',
        explanation: `Leaves the ${PIECE_NAMES[hangingPiece.type]} on ${hangingPiece.square} undefended and vulnerable.`
      }
    }
  }

  // 3. Bad piece trade / negative exchange
  if (move.captured && evalLoss >= 150) {
    const capturedVal = PIECE_VALUES[move.captured] || 0
    const movedVal = PIECE_VALUES[move.piece] || 0
    if (movedVal > capturedVal && attackedAfter) {
      return {
        pattern: 'Unfavorable Trade',
        explanation: `Sacrifices a ${pieceName} (worth ${movedVal}) for a ${PIECE_NAMES[move.captured]} (worth ${capturedVal}) without compensation.`
      }
    }
  }

  // 4. Missed fork / double attack
  if (bestMoveSan && evalLoss >= 150) {
    if (bestMoveSan.startsWith('N') || bestMoveSan.startsWith('Q')) {
      const bestFork = checkForkPotential(chessBefore, bestMoveLan)
      if (bestFork) {
        return {
          pattern: 'Missed Fork',
          explanation: `Missed ${bestMoveSan}, which forks opponent's ${bestFork.targets.join(' and ')}.`
        }
      }
    }
  }

  // 5. King safety & Castling surrender
  if (move.piece === 'k' && !move.san.includes('O-O') && evalLoss >= 100) {
    const canCastleBefore = chessBefore.getCastlingRights(playerColor)
    if (canCastleBefore.k || canCastleBefore.q) {
      return {
        pattern: 'King Safety',
        explanation: `Moves the king and forfeits castling rights, leaving the king exposed in the center.`
      }
    }
  }

  // 6. Inaccuracy or general mistake
  if (evalLoss >= 200) {
    return {
      pattern: 'Blunder',
      explanation: bestMoveSan
        ? `Severe blunder costing decisive material. Stronger was ${bestMoveSan}.`
        : `Severe blunder leaving opponent with a winning positional advantage.`
    }
  } else if (evalLoss >= 90) {
    return {
      pattern: 'Mistake',
      explanation: bestMoveSan
        ? `Tactical mistake conceding the initiative. Better was ${bestMoveSan}.`
        : `Positional mistake that weakens pawn structure and piece coordination.`
    }
  } else if (evalLoss >= 45) {
    return {
      pattern: 'Inaccuracy',
      explanation: bestMoveSan
        ? `Imprecise move. Better was ${bestMoveSan} to optimize piece placement.`
        : `Minor inaccuracy conceding active squares to opponent.`
    }
  } else if (evalLoss >= 18) {
    return {
      pattern: 'Good Move',
      explanation: bestMoveSan
        ? `Playable move, though ${bestMoveSan} kept tighter control.`
        : `Solid move maintaining a balanced position.`
    }
  }

  // Good or Best move
  if (move.san.includes('O-O')) {
    return {
      pattern: 'King Safety',
      explanation: 'Castles the king into safety and connects rooks along the back rank.'
    }
  }

  if (move.captured) {
    return {
      pattern: 'Material Capture',
      explanation: `Accurately captures opponent's ${PIECE_NAMES[move.captured]} on ${targetSquare}.`
    }
  }

  return {
    pattern: 'Best Move',
    explanation: 'Optimal engine-recommended move maintaining piece activity and board control.'
  }
}

function isSquareAttacked(chess: Chess, square: Square, byColor: Color): boolean {
  // Use isAttacked if available or test moves
  if (typeof (chess as any).isAttacked === 'function') {
    return (chess as any).isAttacked(square, byColor)
  }
  // Otherwise check if any legal move of byColor can capture on square
  const testChess = new Chess(chess.fen())
  // Force turn to byColor if needed
  const tokens = testChess.fen().split(' ')
  tokens[1] = byColor
  try {
    const forced = new Chess(tokens.join(' '))
    const moves = forced.moves({ verbose: true })
    return moves.some((m) => m.to === square)
  } catch {
    return false
  }
}

function findHangingPiece(chess: Chess, playerColor: Color): { square: Square; type: PieceSymbol } | null {
  const board = chess.board()
  const opponentColor: Color = playerColor === 'w' ? 'b' : 'w'

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p && p.color === playerColor && p.type !== 'k') {
        const sq = p.square
        const attacked = isSquareAttacked(chess, sq, opponentColor)
        const defended = isSquareAttacked(chess, sq, playerColor)
        if (attacked && !defended && PIECE_VALUES[p.type] >= 3) {
          return { square: sq, type: p.type }
        }
      }
    }
  }
  return null
}

function checkForkPotential(chess: Chess, moveLan?: string): { targets: string[] } | null {
  if (!moveLan || moveLan.length < 4) return null
  const toSq = moveLan.slice(2, 4) as Square

  const testChess = new Chess(chess.fen())
  try {
    testChess.move({ from: moveLan.slice(0, 2) as Square, to: toSq })
  } catch {
    return null
  }

  const oppColor: Color = testChess.turn()
  const targets: string[] = []
  const board = testChess.board()

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === oppColor && PIECE_VALUES[piece.type] >= 3) {
        if (isSquareAttacked(testChess, piece.square, oppColor === 'w' ? 'b' : 'w')) {
          targets.push(PIECE_NAMES[piece.type])
        }
      }
    }
  }

  if (targets.length >= 2) {
    return { targets }
  }
  return null
}
