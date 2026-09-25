import type { ParsedMove } from '../lib/pgnParser'
import openingTipsData from '../data/openingTips.json'
import { BookOpen, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { ClassificationBadge } from './ClassificationBadge'

interface MoveExplanationProps {
  currentMove?: ParsedMove
  openingName?: string
  ecoCode?: string
  whitePlayer: string
  blackPlayer: string
}

interface OpeningTip {
  name: string
  ecoPrefix: string
  theme: string
  keyPlans: string[]
  pawnBreaks: string[]
  criticalPieces: string
  pitfalls: string
}

const tipsRecord = openingTipsData as Record<string, OpeningTip>

const CLASSIFICATION_COLORS: Record<string, string> = {
  book: '#a78bfa',
  best: '#81b64c',
  excellent: '#96bc4b',
  good: '#96bc4b',
  inaccuracy: '#e6a428',
  mistake: '#e87830',
  blunder: '#ca3431'
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  book: 'Book Move',
  best: 'Best Move',
  excellent: 'Excellent',
  good: 'Good Move',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder'
}

export const MoveExplanation: React.FC<MoveExplanationProps> = ({
  currentMove,
  openingName = 'Chess Game',
  ecoCode,
  whitePlayer,
  blackPlayer
}) => {
  const matchedTipKey = Object.keys(tipsRecord).find((key) =>
    openingName.toLowerCase().includes(key.toLowerCase())
  )
  const openingTip: OpeningTip = matchedTipKey ? tipsRecord[matchedTipKey] : tipsRecord['General']

  if (!currentMove) {
    return (
      <div className="rounded-lg px-3.5 py-2.5 flex flex-col gap-1.5 shadow-sm" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Starting Position</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              · {whitePlayer} vs {blackPlayer}
            </span>
          </div>
          {ecoCode && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {ecoCode}
            </span>
          )}
        </div>

        {openingTip && (
          <div className="flex items-center gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <span className="font-medium truncate" style={{ color: 'var(--text)' }}>{openingName}</span>
            <span className="text-[11px] truncate opacity-75" style={{ color: 'var(--text-secondary)' }}>— {openingTip.theme}</span>
          </div>
        )}
      </div>
    )
  }

  const isWhite = currentMove.color === 'w'
  const playerName = isWhite ? whitePlayer : blackPlayer
  const classification = currentMove.classification || 'good'
  const classColor = CLASSIFICATION_COLORS[classification] || 'var(--text-muted)'
  const classLabel = CLASSIFICATION_LABELS[classification] || 'Good'
  const isError = ['inaccuracy', 'mistake', 'blunder'].includes(classification)

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
      {/* Classification header bar */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `2px solid ${classColor}` }}>
        <ClassificationBadge classification={classification} size={28} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[15px]" style={{ color: 'var(--text)' }}>
              {currentMove.moveNumber}.{isWhite ? '' : '..'} {currentMove.san}
            </span>
            <span className="text-xs font-semibold rounded px-1.5 py-0.5" style={{ backgroundColor: classColor + '20', color: classColor }}>
              {classLabel}
            </span>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {playerName} ({isWhite ? 'White' : 'Black'})
            {currentMove.tacticalPattern && ` · ${currentMove.tacticalPattern}`}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-start gap-2.5">
          {isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: classColor }} />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: classColor }} />
          )}
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {currentMove.explanation || 'Solid move maintaining piece coordination.'}
          </p>
        </div>

        {/* Better move suggestion */}
        {isError && currentMove.bestMoveSan && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'var(--bg-elevated)' }}>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Better:</span>
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
              {currentMove.bestMoveSan}
            </span>
          </div>
        )}

        {/* Opening pitfall reminder */}
        {currentMove.moveNumber <= 12 && openingTip && isError && (
          <div className="text-[11px] italic pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
            Pitfall: {openingTip.pitfalls}
          </div>
        )}
      </div>
    </div>
  )
}
