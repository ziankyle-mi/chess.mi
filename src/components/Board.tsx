import { useMemo, useRef, useEffect, useState } from 'react'
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

  // Reset user highlights on position change
  const [prevFen, setPrevFen] = useState(fen)
  if (prevFen !== fen) {
    setPrevFen(fen)
    setUserSquareHighlights({})
  }

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

    return styles
  }, [lastMove, boardTheme, kingInCheckSquare, userSquareHighlights])

  // Badge overlay data
  const badge = useMemo(() => {
    if (!lastMove?.to || !classification) return null
    return { square: lastMove.to, classification }
  }, [lastMove, classification])

  const badgePos = useMemo(() => {
    if (!badge || boardSize === 0) return null
    return squareToPixel(badge.square, orientation, boardSize)
  }, [badge, orientation, boardSize])

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
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare || !onMakeMove) return false
            return onMakeMove(sourceSquare, targetSquare)
          },
          onSquareRightClick: ({ square }) => {
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
          onSquareClick: () => {
            setUserSquareHighlights({})
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
