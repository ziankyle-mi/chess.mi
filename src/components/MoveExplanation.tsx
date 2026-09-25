import React, { useState, useMemo } from 'react'
import type { ParsedMove } from '../lib/pgnParser'
import openingTipsData from '../data/openingTips.json'
import { BookOpen, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Zap, Info } from 'lucide-react'
import { ClassificationBadge } from './ClassificationBadge'
import { generateDeepExplanation } from '../lib/deepMoveExplanation'

interface MoveExplanationProps {
  currentMove?: ParsedMove
  openingName?: string
  ecoCode?: string
  whitePlayer: string
  blackPlayer: string
  isExploration?: boolean
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
  blackPlayer,
  isExploration = false
}) => {
  // Explanation mode: 'depth' (in-depth coach) vs 'concise' (quick summary)
  const [explanationMode, setExplanationMode] = useState<'depth' | 'concise'>(() => {
    const saved = localStorage.getItem('chess_explanation_mode')
    return (saved === 'concise' ? 'concise' : 'depth')
  })

  const handleModeChange = (mode: 'depth' | 'concise') => {
    setExplanationMode(mode)
    localStorage.setItem('chess_explanation_mode', mode)
  }

  const matchedTipKey = Object.keys(tipsRecord).find((key) =>
    openingName.toLowerCase().includes(key.toLowerCase())
  )
  const openingTip: OpeningTip = matchedTipKey ? tipsRecord[matchedTipKey] : tipsRecord['General']

  const deep = useMemo(() => {
    if (!currentMove) return null
    return generateDeepExplanation(currentMove, currentMove.bestMoveSan, openingTip?.theme)
  }, [currentMove, openingTip])

  if (!currentMove) {
    return (
      <div
        className="rounded-lg overflow-hidden flex flex-col transition-all duration-150"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          minHeight: explanationMode === 'depth' ? '210px' : '135px'
        }}
      >
        <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: '2px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-mono font-bold text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              0
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Starting Position</span>
                {ecoCode && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {ecoCode}
                  </span>
                )}
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {whitePlayer} vs {blackPlayer}
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded shrink-0 select-none text-[11px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => handleModeChange('concise')}
              className="px-2 py-0.5 rounded font-medium transition-all cursor-pointer"
              style={{
                background: explanationMode === 'concise' ? 'var(--bg-panel)' : 'transparent',
                color: explanationMode === 'concise' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: explanationMode === 'concise' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
              }}
              title="Concise move summary"
            >
              Concise
            </button>
            <button
              onClick={() => handleModeChange('depth')}
              className="px-2 py-0.5 rounded font-medium transition-all cursor-pointer"
              style={{
                background: explanationMode === 'depth' ? 'var(--bg-panel)' : 'transparent',
                color: explanationMode === 'depth' ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: explanationMode === 'depth' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
              }}
              title="In-depth tactical coach breakdown"
            >
              In-Depth Coach
            </button>
          </div>
        </div>

        <div className="px-4 py-3 flex-1 flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <BookOpen className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <span className="font-medium truncate" style={{ color: 'var(--text)' }}>{openingName}</span>
            <span className="text-[11px] truncate opacity-75" style={{ color: 'var(--text-secondary)' }}>— {openingTip?.theme || 'Standard Game'}</span>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {openingTip?.keyPlans?.[0]
              ? `Key Plan: ${openingTip.keyPlans[0]}`
              : 'Both sides contest the center and coordinate pieces. Use ← → arrows to analyze each move.'}
          </p>

          <div className="text-[11px] pt-1 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            <span>Press → or click moves below to begin</span>
            <span className="font-mono">Move 0</span>
          </div>
        </div>
      </div>
    )
  }

  const isWhite = currentMove.color === 'w'
  const playerName = isWhite ? whitePlayer : blackPlayer
  const classification = currentMove.classification || 'good'
  const classColor = CLASSIFICATION_COLORS[classification] || 'var(--text-muted)'
  const classLabel = CLASSIFICATION_LABELS[classification] || 'Good'
  const isError = ['inaccuracy', 'mistake', 'blunder', 'miss'].includes(classification)

  return (
    <div
      className="rounded-lg overflow-hidden flex flex-col transition-all duration-150"
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        minHeight: explanationMode === 'depth' ? '210px' : '135px'
      }}
    >
      {/* Classification & Mode Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ borderBottom: `2px solid ${classColor}` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <ClassificationBadge classification={classification} size={26} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
                {currentMove.moveNumber}.{isWhite ? '' : '..'} {currentMove.san}
              </span>
              <span className="text-[11px] font-semibold rounded px-1.5 py-0.5" style={{ backgroundColor: classColor + '20', color: classColor }}>
                {classLabel}
              </span>
              {isExploration && (
                <span className="text-[10px] uppercase font-mono px-1 rounded font-semibold" style={{ background: 'var(--accent)', color: '#000' }}>
                  Variation
                </span>
              )}
            </div>
            <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              {playerName} ({isWhite ? 'White' : 'Black'})
              {currentMove.tacticalPattern && ` · ${currentMove.tacticalPattern}`}
            </div>
          </div>
        </div>

        {/* Toggle between In-Depth Coach & Concise modes */}
        <div className="flex items-center p-0.5 rounded shrink-0 select-none text-[11px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => handleModeChange('concise')}
            className="px-2 py-0.5 rounded font-medium transition-all cursor-pointer"
            style={{
              background: explanationMode === 'concise' ? 'var(--bg-panel)' : 'transparent',
              color: explanationMode === 'concise' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: explanationMode === 'concise' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
            }}
            title="Concise move summary"
          >
            Concise
          </button>
          <button
            onClick={() => handleModeChange('depth')}
            className="px-2 py-0.5 rounded font-medium transition-all cursor-pointer"
            style={{
              background: explanationMode === 'depth' ? 'var(--bg-panel)' : 'transparent',
              color: explanationMode === 'depth' ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: explanationMode === 'depth' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
            }}
            title="In-depth tactical coach breakdown"
          >
            In-Depth Coach
          </button>
        </div>
      </div>

      {/* Mode 1: In-Depth Coach View */}
      {explanationMode === 'depth' && deep && (
        <div className="px-4 py-3 space-y-3">
          {/* Tactical headline & role */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded tracking-wide"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              >
                {deep.tacticalRole}
              </span>
              {currentMove.moveAccuracy !== undefined && (
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Acc: <strong style={{ color: 'var(--text)' }}>{Math.round(currentMove.moveAccuracy)}%</strong>
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
              {deep.headline}
            </h4>
          </div>

          {/* Detailed Narrative */}
          <div className="flex items-start gap-2.5">
            {isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: classColor }} />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: classColor }} />
            )}
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {deep.explanation}
            </p>
          </div>

          {/* Tactical Dynamics / Threat breakdown */}
          <div className="space-y-1.5 pt-1">
            {deep.threats.prevented && (
              <div className="flex items-start gap-2 px-2.5 py-1.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text)' }}>Defense: </strong>
                  {deep.threats.prevented}
                </span>
              </div>
            )}

            {deep.threats.created && (
              <div className="flex items-start gap-2 px-2.5 py-1.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text)' }}>Offense: </strong>
                  {deep.threats.created}
                </span>
              </div>
            )}

            {deep.threats.conceded && (
              <div className="flex items-start gap-2 px-2.5 py-1.5 rounded text-xs" style={{ background: 'rgba(232, 120, 48, 0.1)', border: '1px solid rgba(232, 120, 48, 0.25)' }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: classColor }} />
                <span style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: classColor }}>Tactical concession: </strong>
                  {deep.threats.conceded}
                </span>
              </div>
            )}
          </div>

          {/* Strategic Insight / Why it matters */}
          {deep.whyItMatters && (
            <div className="flex items-start gap-2 text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
              <p className="leading-relaxed">
                <strong style={{ color: 'var(--text-secondary)' }}>Principle: </strong>
                {deep.whyItMatters}
              </p>
            </div>
          )}

          {/* Better Move Comparison (when inaccuracy, mistake, or blunder) */}
          {isError && deep.bestMoveComparison && (
            <div className="p-2.5 rounded-md space-y-1.5 mt-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Engine Recommendation
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-panel)', color: 'var(--accent)' }}>
                  {deep.bestMoveComparison.bestMoveSan}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {deep.bestMoveComparison.whyBetter}
              </p>
              {deep.bestMoveComparison.evalDiffText && (
                <div className="text-[10px] font-mono text-right" style={{ color: 'var(--text-muted)' }}>
                  {deep.bestMoveComparison.evalDiffText}
                </div>
              )}
            </div>
          )}

          {/* Board Impact Footer */}
          <div className="flex items-center justify-between text-[11px] pt-2" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            <span className="truncate max-w-[200px]">{deep.boardImpact.kingSafety}</span>
            {deep.boardImpact.keySquaresControlled.length > 0 && (
              <div className="flex items-center gap-1 font-mono">
                <span>Center:</span>
                {deep.boardImpact.keySquaresControlled.map((sq) => (
                  <span key={sq} className="px-1 py-0.2 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text)' }}>
                    {sq}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Concise Summary View */}
      {explanationMode === 'concise' && (
        <div className="px-4 py-3 flex-1 flex flex-col justify-between space-y-2.5">
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

          {/* Better move suggestion or stable footer row */}
          {isError && currentMove.bestMoveSan ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: 'var(--bg-elevated)' }}>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Better:</span>
              <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
                {currentMove.bestMoveSan}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] pt-1" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <span className="truncate max-w-[260px]">{openingTip?.theme || openingName}</span>
              <span className="font-mono shrink-0">Move {currentMove.moveNumber}</span>
            </div>
          )}

          {/* Opening pitfall reminder */}
          {currentMove.moveNumber <= 12 && openingTip && isError && (
            <div className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>
              Pitfall: {openingTip.pitfalls}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
