import { Chess, type PieceSymbol } from 'chess.js'

// Standard piece values in centipawns
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 900,
  k: 20000
}

// Classical piece-square tables (from White's perspective)
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
]

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
]

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
]

const ROOK_TABLE = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
]

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
]

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
]

const TABLES: Record<PieceSymbol, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_TABLE
}

export function evaluateStaticFen(fen: string): { eval: number; bestMoveLan?: string; bestMoveSan?: string } {
  const chess = new Chess(fen)

  if (chess.isCheckmate()) {
    const turn = chess.turn()
    return {
      eval: turn === 'w' ? -10000 : 10000
    }
  }

  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return { eval: 0 }
  }

  const turn = chess.turn()
  const legalMoves = chess.moves({ verbose: true })
  if (legalMoves.length === 0) return { eval: getBoardScore(chess) }

  // --- Fix A + B: True 2-ply negamax ---
  // For each candidate move for the side to move, play it, then find the
  // opponent's best reply (1-ply), and return the score AFTER both.
  // This gives a real minimax estimate, not just the raw PST snapshot.

  let bestScore = turn === 'w' ? -99999 : 99999
  let bestMove = legalMoves[0]

  for (const move of legalMoves) {
    chess.move(move)

    let score: number

    if (chess.isCheckmate()) {
      // This move checkmates the opponent — it's the absolute best
      score = turn === 'w' ? 9900 : -9900
    } else if (chess.isDraw() || chess.isStalemate() || chess.isInsufficientMaterial()) {
      score = 0
    } else {
      // 1-ply opponent reply: find their best move and score after it
      const replies = chess.moves({ verbose: true })

      if (replies.length === 0) {
        score = getBoardScore(chess)
      } else {
        // Opponent minimizes (if original turn was white) or maximizes (if black)
        let replyBest = turn === 'w' ? 99999 : -99999

        for (const reply of replies) {
          chess.move(reply)
          const replyScore = getBoardScore(chess)
          chess.undo()

          if (turn === 'w') {
            // Opponent (black) minimizes
            if (replyScore < replyBest) replyBest = replyScore
          } else {
            // Opponent (white) maximizes
            if (replyScore > replyBest) replyBest = replyScore
          }
        }

        score = replyBest
      }
    }

    chess.undo()

    // White maximizes, black minimizes
    if (turn === 'w') {
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    } else {
      if (score < bestScore) {
        bestScore = score
        bestMove = move
      }
    }
  }

  return {
    // Fix A: return the true minimax score (best achievable outcome) not the raw board score
    eval: bestScore,
    bestMoveLan: bestMove.lan,
    bestMoveSan: bestMove.san
  }
}

function getBoardScore(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -10000 : 10000
  }
  if (chess.isDraw()) return 0

  let score = 0
  const board = chess.board()

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece) continue

      const pieceVal = PIECE_VALUES[piece.type] || 0
      const sqIndex = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c
      const pstVal = TABLES[piece.type] ? TABLES[piece.type][sqIndex] : 0

      const totalVal = pieceVal + pstVal
      if (piece.color === 'w') {
        score += totalVal
      } else {
        score -= totalVal
      }
    }
  }

  return score
}
