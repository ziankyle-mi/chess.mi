import React, { useEffect, useRef, useState, useMemo } from 'react'
import type { ParsedMove } from '../lib/pgnParser'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Gauge
} from 'lucide-react'
import { ClassificationBadge } from './ClassificationBadge'

export type ClassFilter = 'all' | 'best' | 'book' | 'inaccuracy' | 'mistake' | 'blunder' | 'brilliant' | 'great' | 'miss'

interface MoveListProps {
  moves: ParsedMove[]
  currentIndex: number
  onSelectMove: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onFirst: () => void
  onLast: () => void
  onFlip: () => void
  isPlaying: boolean
  onTogglePlay: () => void
  filterCritical: boolean
  onToggleFilterCritical: () => void
  isAnalyzing: boolean
  playSpeed?: number
  onSpeedChange?: (speed: number) => void
  activeFilter?: ClassFilter
  onFilterChange?: (filter: ClassFilter) => void
}

export const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentIndex,
  onSelectMove,
  onPrev,
  onNext,
  onFirst,
  onLast,
  onFlip,
  isPlaying,
  onTogglePlay,
  filterCritical,
  onToggleFilterCritical,
  isAnalyzing,
  playSpeed = 1200,
  onSpeedChange,
  activeFilter,
  onFilterChange
}) => {
  const activeMoveRef = useRef<HTMLButtonElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [internalFilter, setInternalFilter] = useState<ClassFilter>('all')

  const selectedFilter = activeFilter !== undefined ? activeFilter : internalFilter
  const handleSelectFilter = (f: ClassFilter) => {
    if (onFilterChange) onFilterChange(f)
    setInternalFilter(f)
  }

  useEffect(() => {
    const el = activeMoveRef.current
    const container = containerRef.current
    if (!container) return

    if (!el || currentIndex <= 0) {
      container.scrollTop = 0
      return
    }

    const elRect = el.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    if (elRect.top < containerRect.top) {
      container.scrollTop -= (containerRect.top - elRect.top + 6)
    } else if (elRect.bottom > containerRect.bottom) {
      container.scrollTop += (elRect.bottom - containerRect.bottom + 6)
    }
  }, [currentIndex])

  const movePairs: { moveNumber: number; white?: ParsedMove; black?: ParsedMove }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1]
    })
  }

  const criticalCount = useMemo(() => moves.filter((m) => m.isCritical).length, [moves])

  // Count classification badges
  const classCounts = useMemo(() => {
    const counts = {
      brilliant: 0,
      great: 0,
      best: 0,
      book: 0,
      inaccuracy: 0,
      mistake: 0,
      miss: 0,
      blunder: 0
    }
    for (const m of moves) {
      if (m.classification === 'brilliant') counts.brilliant++
      else if (m.classification === 'great') counts.great++
      else if (m.classification === 'best' || m.classification === 'excellent') counts.best++
      else if (m.classification === 'book') counts.book++
      else if (m.classification === 'inaccuracy') counts.inaccuracy++
      else if (m.classification === 'mistake') counts.mistake++
      else if (m.classification === 'miss') counts.miss++
      else if (m.classification === 'blunder') counts.blunder++
    }
    return counts
  }, [moves])

  const speedOptions = [
    { label: '0.5x', ms: 2000 },
    { label: '1x', ms: 1200 },
    { label: '1.5x', ms: 800 },
    { label: '2x', ms: 500 }
  ]

  return (
    <div className="flex flex-col rounded-lg overflow-hidden shadow-sm" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-1">
          {[
            { icon: ChevronsLeft, onClick: onFirst, disabled: currentIndex <= -1, label: 'First' },
            { icon: ChevronLeft, onClick: onPrev, disabled: currentIndex <= -1, label: 'Prev' },
            { icon: isPlaying ? Pause : Play, onClick: onTogglePlay, disabled: moves.length === 0, label: isPlaying ? 'Pause' : 'Play' },
            { icon: ChevronRight, onClick: onNext, disabled: currentIndex >= moves.length - 1, label: 'Next' },
            { icon: ChevronsRight, onClick: onLast, disabled: currentIndex >= moves.length - 1, label: 'Last' }
          ].map(({ icon: Icon, onClick, disabled, label }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              className="p-1.5 rounded transition-colors disabled:opacity-25"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}

          {/* Speed Selector */}
          {onSpeedChange && (
            <div className="flex items-center ml-1.5 pl-1.5 border-l border-[var(--border-subtle)] gap-0.5">
              <Gauge className="w-3.5 h-3.5 opacity-60 mr-0.5" style={{ color: 'var(--text-muted)' }} />
              {speedOptions.map(({ label, ms }) => (
                <button
                  key={label}
                  onClick={() => onSpeedChange(ms)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all"
                  style={{
                    background: playSpeed === ms ? 'var(--accent)' : 'transparent',
                    color: playSpeed === ms ? 'var(--accent-text)' : 'var(--text-muted)'
                  }}
                  title={`Play speed: ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFilterCritical}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: filterCritical ? 'var(--accent)' : 'var(--bg-elevated)',
              color: filterCritical ? 'var(--accent-text)' : 'var(--text-muted)',
              border: filterCritical ? 'none' : '1px solid var(--border-subtle)'
            }}
            title="Filter critical turning points only"
          >
            <Zap className="w-3 h-3" />
            {criticalCount}
          </button>

          <button
            onClick={onFlip}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            title="Flip Board (F)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Game Review Quick Filter Pills (Chess.com style) */}
      {moves.length > 0 && (
        <div
          className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto text-[11px] border-b select-none"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-secondary)'
          }}
        >
          <button
            onClick={() => handleSelectFilter('all')}
            className="px-2 py-0.5 rounded transition-all font-medium whitespace-nowrap"
            style={{
              background: selectedFilter === 'all' ? 'var(--bg-elevated)' : 'transparent',
              color: selectedFilter === 'all' ? 'var(--text)' : 'var(--text-muted)'
            }}
          >
            All ({moves.length})
          </button>

          {classCounts.brilliant > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'brilliant' ? 'all' : 'brilliant')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'brilliant' ? '#1baca625' : 'transparent',
                color: selectedFilter === 'brilliant' ? '#1baca6' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'brilliant' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="brilliant" size={15} />
              <span>Brilliant ({classCounts.brilliant})</span>
            </button>
          )}

          {classCounts.great > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'great' ? 'all' : 'great')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'great' ? '#5c8bb025' : 'transparent',
                color: selectedFilter === 'great' ? '#5c8bb0' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'great' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="great" size={15} />
              <span>Great ({classCounts.great})</span>
            </button>
          )}

          {classCounts.best > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'best' ? 'all' : 'best')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'best' ? '#96bc4b25' : 'transparent',
                color: selectedFilter === 'best' ? '#96bc4b' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'best' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="best" size={15} />
              <span>Best ({classCounts.best})</span>
            </button>
          )}

          {classCounts.book > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'book' ? 'all' : 'book')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'book' ? '#a8886525' : 'transparent',
                color: selectedFilter === 'book' ? '#a88865' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'book' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="book" size={15} />
              <span>Book ({classCounts.book})</span>
            </button>
          )}

          {classCounts.inaccuracy > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'inaccuracy' ? 'all' : 'inaccuracy')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'inaccuracy' ? '#f7c63125' : 'transparent',
                color: selectedFilter === 'inaccuracy' ? '#f7c631' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'inaccuracy' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="inaccuracy" size={15} />
              <span>?! ({classCounts.inaccuracy})</span>
            </button>
          )}

          {classCounts.mistake > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'mistake' ? 'all' : 'mistake')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'mistake' ? '#e6912c25' : 'transparent',
                color: selectedFilter === 'mistake' ? '#e6912c' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'mistake' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="mistake" size={15} />
              <span>? ({classCounts.mistake})</span>
            </button>
          )}

          {classCounts.miss > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'miss' ? 'all' : 'miss')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'miss' ? '#ee555525' : 'transparent',
                color: selectedFilter === 'miss' ? '#ee5555' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'miss' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="miss" size={15} />
              <span>Miss ({classCounts.miss})</span>
            </button>
          )}

          {classCounts.blunder > 0 && (
            <button
              onClick={() => handleSelectFilter(selectedFilter === 'blunder' ? 'all' : 'blunder')}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-all whitespace-nowrap"
              style={{
                background: selectedFilter === 'blunder' ? '#ca343125' : 'transparent',
                color: selectedFilter === 'blunder' ? '#ca3431' : 'var(--text-muted)',
                fontWeight: selectedFilter === 'blunder' ? 600 : 500
              }}
            >
              <ClassificationBadge classification="blunder" size={15} />
              <span>?? ({classCounts.blunder})</span>
            </button>
          )}
        </div>
      )}

      {/* Moves */}
      <div ref={containerRef} className="flex-1 overflow-y-auto max-h-[330px] text-[13px]">
        {moves.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Load a game to see moves here.
          </div>
        ) : (
          movePairs.map((pair) => {
            if (filterCritical && !pair.white?.isCritical && !pair.black?.isCritical) return null

            // Apply category filter if active
            if (selectedFilter !== 'all') {
              const matchWhite = matchesFilter(pair.white, selectedFilter)
              const matchBlack = matchesFilter(pair.black, selectedFilter)
              if (!matchWhite && !matchBlack) return null
            }

            return (
              <div key={pair.moveNumber} className="flex items-stretch" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="w-[36px] shrink-0 flex items-center justify-center text-xs font-mono" style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                  {pair.moveNumber}
                </div>
                <MoveCell
                  move={pair.white}
                  isActive={pair.white ? currentIndex === pair.white.index : false}
                  onClick={() => pair.white && onSelectMove(pair.white.index)}
                  ref={pair.white && currentIndex === pair.white.index ? activeMoveRef : null}
                />
                <MoveCell
                  move={pair.black}
                  isActive={pair.black ? currentIndex === pair.black.index : false}
                  onClick={() => pair.black && onSelectMove(pair.black.index)}
                  ref={pair.black && currentIndex === pair.black.index ? activeMoveRef : null}
                />
              </div>
            )
          })
        )}
      </div>

      {isAnalyzing && (
        <div className="px-3 py-2 text-[11px] flex items-center gap-2" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          Stockfish analyzing moves...
        </div>
      )}
    </div>
  )
}

function matchesFilter(move: ParsedMove | undefined, filter: ClassFilter): boolean {
  if (!move || !move.classification) return false
  if (filter === 'best') return ['best', 'excellent'].includes(move.classification)
  return move.classification === filter
}

interface MoveCellProps {
  move?: ParsedMove
  isActive: boolean
  onClick: () => void
}

const MoveCell = React.forwardRef<HTMLButtonElement, MoveCellProps>(
  ({ move, isActive, onClick }, ref) => {
    if (!move) return <div className="flex-1 min-w-0" />

    return (
      <button
        ref={ref}
        onClick={onClick}
        className="flex-1 min-w-0 flex items-center gap-1.5 px-2.5 py-[7px] text-left transition-colors font-medium select-none"
        style={{
          background: isActive ? 'var(--bg-elevated)' : 'transparent',
          color: isActive ? 'var(--text)' : 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px'
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Classification badge */}
        {move.classification && (
          <ClassificationBadge classification={move.classification} size={15} />
        )}
        <span className="truncate">{move.san}</span>
      </button>
    )
  }
)

MoveCell.displayName = 'MoveCell'
