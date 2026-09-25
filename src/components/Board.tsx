import { useMemo, useRef, useEffect, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { Arrow } from 'react-chessboard'
import { useTheme } from '../lib/ThemeContext'
import { ClassificationBadge } from './ClassificationBadge'

interface BoardProps {
  fen: string
  orientation: 'white' | 'black'
  lastMove?: { from: string; to: string }
  bestMoveLan?: string
  showBestMoveArrow?: boolean
  classification?: string
  kingInCheckSquare?: string
  onMakeMove?: (from: string, to: string) => boolean
  allowDragging?: boolean
}

/**
 * Given a square like "e4", board orientation, and board pixel size,
 * return the { left, top } pixel position for the badge (bottom-right corner of the square).
 */
function squareToPixel(
  square: string,
  orientation: 'white' | 'black',
  boardSize: number
) {
  const file = square.charCodeAt(0) - 97 // a=0..h=7
  const rank = parseInt(square[1], 10) - 1 // 1=0..8=7

  const sqSize = boardSize / 8

  let col: number, row: number
  if (orientation === 'white') {
    col = file
    row = 7 - rank
  } else {
    col = 7 - file
    row = rank
  }

  // Position badge at bottom-right of the square
  return {
    left: col * sqSize + sqSize - 2,
    top: row * sqSize + sqSize - 2
  }
}

export const Board: React.FC<BoardProps> = ({
  fen,
  orientation,
  lastMove,
  bestMoveLan,
  showBestMoveArrow = true,
  classification,
  kingInCheckSquare,
  onMakeMove,
  allowDragging = true
}) => {
  const { boardTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [boardSize, setBoardSize] = useState(0)
  const [userSquareHighlights, setUserSquareHighlights] = useState<Record<string, string>>({})
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const lastClickTimeRef = useRef<{ square: string; time: number }>({ square: '', time: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardSize(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    setBoardSize(containerRef.current.offsetWidth)
    return () => observer.disconnect()
  }, [])

  // Reset user highlights & selection on position change
  const [prevFen, setPrevFen] = useState(fen)
  if (prevFen !== fen) {
    setPrevFen(fen)
    setUserSquareHighlights({})
    setSelectedSquare(null)
  }

  // Calculate legal moves for selected piece
  const legalMovesFromSelected = useMemo(() => {
    if (!selectedSquare || !allowDragging || !onMakeMove) return []
    try {
      const chess = new Chess(fen)
      return chess.moves({ square: selectedSquare as Square, verbose: true })
    } catch {
      return []
    }
  }, [fen, selectedSquare, allowDragging, onMakeMove])

  const arrows = useMemo(() => {
    const list: Arrow[] = []
    if (showBestMoveArrow && bestMoveLan && bestMoveLan.length >= 4) {
      const from = bestMoveLan.slice(0, 2)
      const to = bestMoveLan.slice(2, 4)
      // Don't draw arrow if the best move IS the move that was played
      if (!lastMove || from !== lastMove.from || to !== lastMove.to) {
        list.push({
          startSquare: from,
          endSquare: to,
          color: 'rgba(96, 180, 50, 0.85)'
        })
      }
    }
    return list
  }, [lastMove, bestMoveLan, showBestMoveArrow])

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {}

    // Last move highlights
    if (lastMove?.from) {
      styles[lastMove.from] = { backgroundColor: boardTheme.lastMoveLight }
    }
    if (lastMove?.to) {
      styles[lastMove.to] = { backgroundColor: boardTheme.lastMoveDark }
    }

    // King in check red radial pulse
    if (kingInCheckSquare) {
      styles[kingInCheckSquare] = {
        background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.85) 0%, rgba(239, 68, 68, 0.4) 60%, transparent 80%)',
        boxShadow: 'inset 0 0 10px rgba(220, 38, 38, 0.7)'
      }
    }

    // User right-click highlights
    for (const [sq, color] of Object.entries(userSquareHighlights)) {
      styles[sq] = {
        backgroundColor: color,
        boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.35)'
      }
    }

    // Selected piece highlight
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(129, 182, 76, 0.45)',
        boxShadow: 'inset 0 0 0 2.5px var(--accent)'
      }
    }

    // Legal move indicators (centered dots for empty squares, outer rings for captures)
    for (const move of legalMovesFromSelected) {
      const isCapture = Boolean(move.captured || move.flags.includes('c') || move.flags.includes('e'))
      const baseColor = styles[move.to]?.backgroundColor ? `${styles[move.to]?.backgroundColor}` : undefined

      if (isCapture) {
        styles[move.to] = {
          ...styles[move.to],
          background: baseColor
            ? `radial-gradient(circle, transparent 52%, rgba(129, 182, 76, 0.85) 54%, rgba(129, 182, 76, 0.85) 68%, transparent 70%), ${baseColor}`
            : 'radial-gradient(circle, transparent 52%, rgba(129, 182, 76, 0.85) 54%, rgba(129, 182, 76, 0.85) 68%, transparent 70%)',
          cursor: 'pointer'
        }
      } else {
        styles[move.to] = {
          ...styles[move.to],
          background: baseColor
            ? `radial-gradient(circle, rgba(129, 182, 76, 0.85) 22%, transparent 23%), ${baseColor}`
            : 'radial-gradient(circle, rgba(129, 182, 76, 0.85) 22%, transparent 23%)',
          cursor: 'pointer'
        }
      }
    }

    return styles
  }, [lastMove, boardTheme, kingInCheckSquare, userSquareHighlights, selectedSquare, legalMovesFromSelected])

  // Badge overlay data
  const badge = useMemo(() => {
    if (!lastMove?.to || !classification) return null
    return { square: lastMove.to, classification }
  }, [lastMove, classification])

  const badgePos = useMemo(() => {
    if (!badge || boardSize === 0) return null
    return squareToPixel(badge.square, orientation, boardSize)
  }, [badge, orientation, boardSize])

  const handleSquareClick = (square: string) => {
    setUserSquareHighlights({})

    if (!allowDragging || !onMakeMove) {
      setSelectedSquare(null)
      return
    }

    const now = Date.now()
    if (lastClickTimeRef.current.square === square && now - lastClickTimeRef.current.time < 80) {
      return
    }
    lastClickTimeRef.current = { square, time: now }

    // If a piece is already selected:
    if (selectedSquare) {
      // Check if clicked square is a legal destination
      const isLegalTarget = legalMovesFromSelected.some((m) => m.to === square)
      if (isLegalTarget) {
        onMakeMove(selectedSquare, square)
        setSelectedSquare(null)
        return
      }

      // Clicking the same square deselects it
      if (selectedSquare === square) {
        setSelectedSquare(null)
        return
      }

      // Check if clicking another piece of the current turn
      try {
        const chess = new Chess(fen)
        const pieceOnSquare = chess.get(square as Square)
        if (pieceOnSquare && pieceOnSquare.color === chess.turn()) {
          setSelectedSquare(square)
          return
        }
      } catch {
        // fallback
      }

      // Clicked anywhere else -> deselect
      setSelectedSquare(null)
      return
    }

    // No piece selected yet: check if clicking a piece belonging to the active player
    try {
      const chess = new Chess(fen)
      const piece = chess.get(square as Square)
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square)
      }
    } catch {
      setSelectedSquare(null)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[530px] aspect-square select-none shadow-md rounded-md overflow-hidden"
      style={{
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Chessboard
        options={{
          position: fen,
          boardOrientation: orientation,
          allowDragging: allowDragging && Boolean(onMakeMove),
          animationDurationInMs: 200,
          darkSquareStyle: { backgroundColor: boardTheme.darkSquare },
          lightSquareStyle: { backgroundColor: boardTheme.lightSquare },
          boardStyle: {
            borderRadius: '0px',
            boxShadow: 'none'
          },
          darkSquareNotationStyle: {
            color: boardTheme.lightSquare + 'cc',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          },
          lightSquareNotationStyle: {
            color: boardTheme.darkSquare + 'cc',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600
          },
          arrows,
          squareStyles,
          allowDrawingArrows: true,
          clearArrowsOnClick: false,
          onPieceDrag: ({ square }) => {
            if (allowDragging && onMakeMove && square) {
              setSelectedSquare(square)
            }
          },
          onPieceDragCancel: () => {
            setSelectedSquare(null)
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            setSelectedSquare(null)
            if (!targetSquare || !onMakeMove) return false
            return onMakeMove(sourceSquare, targetSquare)
          },
          onSquareRightClick: ({ square }) => {
            setSelectedSquare(null)
            setUserSquareHighlights((prev) => {
              const next = { ...prev }
              if (next[square]) {
                delete next[square]
              } else {
                next[square] = 'rgba(239, 68, 68, 0.55)'
              }
              return next
            })
          },
          onSquareClick: ({ square }) => {
            if (square) handleSquareClick(square)
          },
          onPieceClick: ({ square }) => {
            if (square) handleSquareClick(square)
          }
        }}
      />

      {/* Chess.com-style vector classification badge on destination square */}
      {badge && badgePos && (
        <div
          className="absolute pointer-events-none transition-transform duration-200"
          style={{
            left: badgePos.left,
            top: badgePos.top,
            transform: 'translate(-50%, -50%)',
            zIndex: 30
          }}
        >
          <ClassificationBadge
            classification={badge.classification}
            size={Math.max(22, Math.min(30, Math.round(boardSize / 18)))}
          />
        </div>
      )}
    </div>
  )
}
