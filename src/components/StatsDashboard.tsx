import type { ParsedMove } from '../lib/pgnParser'
import type { AnalyzedGameRecord, AggregateStats } from '../lib/progressStore'
import { aggregateGameAccuracy } from '../engine/classifyMove'
import { getSampleConfidence } from '../lib/confidence'
import { History, Trash2 } from 'lucide-react'

const CLASS_COLORS: Record<string, string> = {
  book: '#a78bfa',
  best: '#81b64c',
  excellent: '#96bc4b',
  good: '#96bc4b',
  inaccuracy: '#e6a428',
  mistake: '#e87830',
  blunder: '#ca3431'
}

interface StatsDashboardProps {
  currentMoves: ParsedMove[]
  whitePlayer: string
  blackPlayer: string
  aggregateStats: AggregateStats
  recentGames: AnalyzedGameRecord[]
  onClearHistory: () => void
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  currentMoves,
  whitePlayer,
  blackPlayer,
  aggregateStats,
  recentGames,
  onClearHistory
}) => {
  const whiteMoves = currentMoves.filter((m) => m.color === 'w')
  const blackMoves = currentMoves.filter((m) => m.color === 'b')
  const countMoves = (moves: ParsedMove[], type: string) => moves.filter((m) => m.classification === type).length

  const calcAcpl = (moves: ParsedMove[]) => {
    const withEval = moves.filter((m) => m.eval !== undefined)
    if (withEval.length === 0) return 0
    let totalLoss = 0
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i]
      if (m.eval !== undefined) {
        const prevEval = i > 0 ? moves[i - 1].eval || 0 : 0
        const loss = m.color === 'w' ? Math.max(0, prevEval - m.eval) : Math.max(0, m.eval - prevEval)
        totalLoss += loss
      }
    }
    return Math.round(totalLoss / withEval.length)
  }

  const whiteAcpl = calcAcpl(whiteMoves)
  const blackAcpl = calcAcpl(blackMoves)
  const calcCapsAccuracy = (moves: ParsedMove[]) => {
    if (moves.length === 0) return 0
    const accuracies = moves.map((m) => m.moveAccuracy !== undefined ? m.moveAccuracy : 75)
    return aggregateGameAccuracy(accuracies)
  }
  const whiteAccuracy = currentMoves.length > 0 ? calcCapsAccuracy(whiteMoves) : 0
  const blackAccuracy = currentMoves.length > 0 ? calcCapsAccuracy(blackMoves) : 0

  const classRows = [
    { label: 'Brilliant', key: 'brilliant', color: '#26c9a2' },
    { label: 'Great', key: 'great', color: '#5697d0' },
    { label: 'Best', key: 'best', color: CLASS_COLORS.best },
    { label: 'Book', key: 'book', color: CLASS_COLORS.book },
    { label: 'Inaccuracy', key: 'inaccuracy', color: CLASS_COLORS.inaccuracy },
    { label: 'Mistake', key: 'mistake', color: CLASS_COLORS.mistake },
    { label: 'Miss', key: 'miss', color: '#ea584d' },
    { label: 'Blunder', key: 'blunder', color: CLASS_COLORS.blunder }
  ]

  return (
    <div className="rounded-lg p-5 space-y-6" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
      {/* Accuracy Cards */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Game accuracy</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { name: whitePlayer, acc: whiteAccuracy, acpl: whiteAcpl, moves: whiteMoves.length, side: 'White', symbol: '♔', bg: '#e8e6e3', fg: '#312e2b' },
            { name: blackPlayer, acc: blackAccuracy, acpl: blackAcpl, moves: blackMoves.length, side: 'Black', symbol: '♚', bg: '#312e2b', fg: '#e8e6e3' }
          ].map((p) => (
            <div key={p.side} className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold" style={{ background: p.bg, color: p.fg }}>{p.symbol}</span>
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{p.name}</span>
              </div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl font-bold font-mono" style={{ color: 'var(--text)' }}>{p.acc}%</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">({p.moves} moves)</span>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Average loss: {p.acpl} cp</span>
            </div>
          ))}
        </div>

        {/* Classification table */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="grid grid-cols-[1fr_80px_80px] p-2 text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            <span>Classification</span>
            <span className="text-center font-mono">White ({whiteMoves.length})</span>
            <span className="text-center font-mono">Black ({blackMoves.length})</span>
          </div>
          {classRows.map((row) => (
            <div key={row.key} className="grid grid-cols-[1fr_80px_80px] p-2 text-xs items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
              </div>
              <span className="text-center font-mono font-bold" style={{ color: 'var(--text)' }}>{countMoves(whiteMoves, row.key)}</span>
              <span className="text-center font-mono font-bold" style={{ color: 'var(--text)' }}>{countMoves(blackMoves, row.key)}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_80px_80px] p-2 text-xs font-semibold" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total moves evaluated</span>
            <span className="text-center font-mono" style={{ color: 'var(--text)' }}>{whiteMoves.length}</span>
            <span className="text-center font-mono" style={{ color: 'var(--text)' }}>{blackMoves.length}</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Centipawn loss trend</h4>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            Average: {aggregateStats.avgAcplLast20} cp · {getSampleConfidence(aggregateStats.totalGames).caption}
          </span>
        </div>
        {aggregateStats.trendData.length < 2 ? (
          <div className="p-6 rounded-lg text-center text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            Analyze more games to see your progression.
          </div>
        ) : (
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <SvgTrendChart data={aggregateStats.trendData} />
          </div>
        )}
      </div>

      {recentGames.length > 0 && (
        <div className="pt-3 flex items-center justify-between text-xs font-mono" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            {recentGames.length} games stored locally ({getSampleConfidence(recentGames.length).label.toLowerCase()})
          </span>
          <button onClick={onClearHistory} className="flex items-center gap-1 transition-colors hover:opacity-80 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}
    </div>
  )
}

function SvgTrendChart({ data }: { data: { id: string; acpl: number }[] }) {
  if (data.length < 2) return null
  const width = 480, height = 120, padding = 20
  const maxAcpl = Math.max(80, ...data.map((d) => d.acpl))
  const getX = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2)
  const getY = (val: number) => height - padding - (val / maxAcpl) * (height - padding * 2)
  const points = data.map((d, i) => `${getX(i)},${getY(d.acpl)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.id || i} cx={getX(i)} cy={getY(d.acpl)} r="3" fill="var(--bg-panel)" stroke="var(--accent)" strokeWidth="2" />
      ))}
    </svg>
  )
}
