/**
 * Chess game calculations: captured pieces, material advantage, king positions, and check status.
 */

export interface CapturedPieces {
  p: number // pawns
  n: number // knights
  b: number // bishops
  r: number // rooks
  q: number // queens
}

export interface MaterialState {
  whiteCaptured: CapturedPieces // pieces White captured (black pieces)
  blackCaptured: CapturedPieces // pieces Black captured (white pieces)
  materialDiff: number // positive = White is ahead, negative = Black is ahead
  turn: 'w' | 'b'
  inCheck: boolean
  kingSquare?: string
}

const STARTING_COUNTS: Record<string, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9
}

export function computeMaterialAndCaptures(fen: string): MaterialState {
  const parts = fen.split(' ')
  const boardFen = parts[0] || ''
  const turn = (parts[1] || 'w') as 'w' | 'b'

  const counts: Record<string, number> = {
    p: 0, n: 0, b: 0, r: 0, q: 0,
    P: 0, N: 0, B: 0, R: 0, Q: 0
  }

  // Also locate the king of the side to move to detect check square
  const targetKing = turn === 'w' ? 'K' : 'k'
  let kingSquare: string | undefined = undefined

  const rows = boardFen.split('/')
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    let fileIdx = 0
    for (const char of row) {
      if (char >= '1' && char <= '8') {
        fileIdx += parseInt(char, 10)
      } else {
        if (counts[char] !== undefined) {
          counts[char]++
        }
        if (char === targetKing) {
          const file = String.fromCharCode(97 + fileIdx)
          const rank = 8 - r
          kingSquare = `${file}${rank}`
        }
        fileIdx++
      }
    }
  }

  // White captured = starting black minus remaining black
  const whiteCaptured: CapturedPieces = {
    q: Math.max(0, STARTING_COUNTS.q - (counts['q'] || 0)),
    r: Math.max(0, STARTING_COUNTS.r - (counts['r'] || 0)),
    b: Math.max(0, STARTING_COUNTS.b - (counts['b'] || 0)),
    n: Math.max(0, STARTING_COUNTS.n - (counts['n'] || 0)),
    p: Math.max(0, STARTING_COUNTS.p - (counts['p'] || 0))
  }

  // Black captured = starting white minus remaining white
  const blackCaptured: CapturedPieces = {
    q: Math.max(0, STARTING_COUNTS.q - (counts['Q'] || 0)),
    r: Math.max(0, STARTING_COUNTS.r - (counts['R'] || 0)),
    b: Math.max(0, STARTING_COUNTS.b - (counts['B'] || 0)),
    n: Math.max(0, STARTING_COUNTS.n - (counts['N'] || 0)),
    p: Math.max(0, STARTING_COUNTS.p - (counts['P'] || 0))
  }

  let whiteScore = 0
  let blackScore = 0
  for (const [p, val] of Object.entries(PIECE_VALUES)) {
    whiteScore += (counts[p.toUpperCase()] || 0) * val
    blackScore += (counts[p] || 0) * val
  }

  const materialDiff = whiteScore - blackScore

  return {
    whiteCaptured,
    blackCaptured,
    materialDiff,
    turn,
    inCheck: false, // will be verified with chess.js if available
    kingSquare
  }
}
