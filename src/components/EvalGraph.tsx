import { useMemo, useRef } from 'react'
import type { ParsedMove } from '../lib/pgnParser'

interface EvalGraphProps {
  moves: ParsedMove[]
  currentIndex: number
  onSelectMove: (index: number) => void
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  book: '#a78bfa',
  best: '#96bc4b',
  excellent: '#96bc4b',
  good: '#7a9b6a',
  inaccuracy: '#f7c631',
  mistake: '#e6912c',
  blunder: '#ca3431'
}

/**
 * Convert centipawn eval to win probability percentage (0–100) from White's POV.
 * Uses the same logistic function as chess.com.
 */
function evalToWinPct(cp: number, mate?: number): number {
  if (typeof mate === 'number') {
    return mate > 0 ? 100 : 0
  }
  // Logistic win probability
  const prob = 1 / (1 + Math.pow(10, -cp / 400))
  return Math.max(0.5, Math.min(99.5, prob * 100))
}

export const EvalGraph: React.FC<EvalGraphProps> = ({ moves, currentIndex, onSelectMove }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const analyzedMoves = useMemo(() => moves.filter((m) => m.eval !== undefined), [moves])

  if (analyzedMoves.length < 2) return null

  const barWidth = Math.max(3, Math.min(12, 500 / analyzedMoves.length))
  const height = 60
  const midY = height / 2

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickedIndex = Math.floor((x / rect.width) * analyzedMoves.length)
    if (clickedIndex >= 0 && clickedIndex < analyzedMoves.length) {
      onSelectMove(analyzedMoves[clickedIndex].index)
    }
  }

  const totalWidth = analyzedMoves.length * barWidth

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
      {/* Label */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Evaluation Graph
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {analyzedMoves.length} moves
        </span>
      </div>

      {/* Chart */}
      <div className="px-1 pb-1.5 overflow-x-auto">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${totalWidth} ${height}`}
          preserveAspectRatio="none"
          className="cursor-pointer block"
          onClick={handleClick}
          style={{ minWidth: '100%' }}
        >
          {/* Center line */}
          <line x1={0} y1={midY} x2={totalWidth} y2={midY} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />

          {analyzedMoves.map((move, i) => {
            const winPct = evalToWinPct(move.eval!, move.mate)
            const deviation = winPct - 50 // positive = white winning, negative = black winning

            const barHeight = Math.max(1, Math.abs(deviation) * (midY / 50))
            const isWhiteWinning = deviation >= 0

            // Bar color: use classification if it's a notable move, otherwise eval-based
            let barColor: string
            if (move.classification && CLASSIFICATION_COLORS[move.classification]) {
              barColor = CLASSIFICATION_COLORS[move.classification]
            } else {
              barColor = isWhiteWinning ? '#e8e6e3' : '#555555'
            }

            const x = i * barWidth
            const y = isWhiteWinning ? midY - barHeight : midY

            const isActive = move.index === currentIndex

            return (
              <g key={move.index}>
                <rect
                  x={x + 0.5}
                  y={y}
                  width={barWidth - 1}
                  height={barHeight}
                  fill={barColor}
                  opacity={isActive ? 1 : 0.6}
                  rx={1}
                />
                {isActive && (
                  <rect
                    x={x}
                    y={0}
                    width={barWidth}
                    height={height}
                    fill="var(--accent)"
                    opacity={0.2}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
