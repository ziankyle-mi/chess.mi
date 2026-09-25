import React, { useState, useMemo } from 'react'
import type { ParsedMove } from '../lib/pgnParser'
import { generateGameReviewReport } from '../lib/ratingCalculator'
import { ClassificationBadge } from './ClassificationBadge'
import { Swords, ChevronDown, ChevronUp } from 'lucide-react'

interface GameReviewReportProps {
  moves: ParsedMove[]
  whitePlayer: string
  blackPlayer: string
  whiteElo?: number
  blackElo?: number
  openingName?: string
  result?: string
  onReviewMoves: () => void
  onSelectClassificationFilter?: (filter: string) => void
}

export const GameReviewReport: React.FC<GameReviewReportProps> = ({
  moves,
  whitePlayer,
  blackPlayer,
  whiteElo,
  blackElo,
  openingName,
  onReviewMoves,
  onSelectClassificationFilter
}) => {
  const [showFullBreakdown, setShowFullBreakdown] = useState(true)

  const report = useMemo(() => {
    return generateGameReviewReport(moves, whitePlayer, blackPlayer, whiteElo, blackElo, openingName)
  }, [moves, whitePlayer, blackPlayer, whiteElo, blackElo, openingName])

  // Smooth evaluation timeline and clean non-overlapping markers
  const evalSvg = useMemo(() => {
    if (report.evalTimeline.length === 0) return null
    const width = 520
    const height = 75
    const midY = height / 2

    const rawData = report.evalTimeline
    // Apply 3-point moving average smoothing to eliminate saw-tooth noise
    const smoothedEvals = rawData.map((d, i) => {
      const prev = i > 0 ? rawData[i - 1].eval : d.eval
      const next = i < rawData.length - 1 ? rawData[i + 1].eval : d.eval
      return (prev + d.eval * 2 + next) / 4
    })

    const step = width / Math.max(1, rawData.length - 1)
    const points = rawData.map((item, idx) => {
      const x = idx * step
      // Clamp between -700 and +700 centipawns
      const clamped = Math.max(-700, Math.min(700, smoothedEvals[idx]))
      // White advantage goes UP, Black goes DOWN
      const y = midY - (clamped / 700) * (height / 2 - 8)
      return { x, y, ...item }
    })

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`
    }, '')

    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`

    // Filter markers: only major turning points (blunder, mistake, brilliant, miss), strictly spaced apart
    const markers: typeof points = []
    let lastMarkerX = -40

    for (const pt of points) {
      if (
        (pt.classification === 'blunder' ||
          pt.classification === 'mistake' ||
          pt.classification === 'brilliant' ||
          pt.classification === 'miss') &&
        pt.x - lastMarkerX >= 28
      ) {
        markers.push(pt)
        lastMarkerX = pt.x
        if (markers.length >= 6) break
      }
    }

    return { width, height, midY, pathD, areaD, markers }
  }, [report.evalTimeline])

  const breakdownRows = [
    { key: 'brilliant', label: 'Brilliant', white: report.white.brilliantCount, black: report.black.brilliantCount },
    { key: 'great', label: 'Great', white: report.white.greatCount, black: report.black.greatCount },
    { key: 'best', label: 'Best', white: report.white.bestCount, black: report.black.bestCount },
    { key: 'book', label: 'Book', white: report.white.bookCount, black: report.black.bookCount },
    { key: 'inaccuracy', label: 'Inaccuracy', white: report.white.inaccuracyCount, black: report.black.inaccuracyCount },
    { key: 'mistake', label: 'Mistake', white: report.white.mistakeCount, black: report.black.mistakeCount },
    { key: 'miss', label: 'Miss', white: report.white.missCount, black: report.black.missCount },
    { key: 'blunder', label: 'Blunder', white: report.white.blunderCount, black: report.black.blunderCount }
  ]

  const whiteInitial = (whitePlayer.trim()[0] || 'W').toUpperCase()
  const blackInitial = (blackPlayer.trim()[0] || 'B').toUpperCase()

  return (
    <div className="w-full flex flex-col select-none font-sans gap-1">
      {/* Review Panel — varied container treatments per DESIGN.md */}
      <div className="flex flex-col">
        {/* Full Game Evaluation Timeline Graph */}
        {evalSvg && (
          <div
            className="relative w-full h-[70px] overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <svg
              viewBox={`0 0 ${evalSvg.width} ${evalSvg.height}`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="evalCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
                  <stop offset="50%" stopColor="rgba(160, 160, 160, 0.08)" />
                  <stop offset="100%" stopColor="rgba(30, 30, 35, 0.35)" />
                </linearGradient>
              </defs>

              {/* 50% baseline */}
              <line
                x1="0"
                y1={evalSvg.midY}
                x2={evalSvg.width}
                y2={evalSvg.midY}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeDasharray="3 3"
              />

              {/* Shaded Area */}
              <path d={evalSvg.areaD} fill="url(#evalCurveGrad)" />

              {/* Curve Stroke */}
              <path
                d={evalSvg.pathD}
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            </svg>

            {/* Plotted Move Badge Markers (strictly non-overlapping) */}
            <div className="absolute inset-0 pointer-events-none">
              {evalSvg.markers.map((marker, i) => (
                <div
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform"
                  style={{
                    left: `${(marker.x / evalSvg.width) * 100}%`,
                    top: `${Math.max(10, Math.min(evalSvg.height - 10, marker.y)) * (100 / evalSvg.height)}%`
                  }}
                >
                  <ClassificationBadge classification={marker.classification || 'good'} size={13} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3.5 sm:p-4 flex flex-col gap-3">
          {/* Players Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {/* White Player */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-0.5 min-w-0">
              <span className="text-xs font-semibold truncate w-full" style={{ color: 'var(--text)' }}>
                {whitePlayer}
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  {whiteInitial}
                </div>
                <span
                  className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}
                  title="Estimated performance based on play precision"
                >
                  Played like {report.white.gameRating}
                </span>
              </div>
            </div>

            <div className="text-center px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">VS</span>
            </div>

            {/* Black Player */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-0.5 min-w-0">
              <span className="text-xs font-semibold truncate w-full" style={{ color: 'var(--text)' }}>
                {blackPlayer}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}
                  title="Estimated performance based on play precision"
                >
                  Played like {report.black.gameRating}
                </span>
                <div
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  {blackInitial}
                </div>
              </div>
            </div>
          </div>

          {/* Accuracy — HERO element: largest, boldest per DESIGN.md */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center py-2">
            <div className="text-center">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-tighter" style={{ color: 'var(--text)', fontFeatureSettings: '"tnum" 1' }}>
                {report.white.accuracy.toFixed(1)}
              </span>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Accuracy
              </span>
            </div>

            <div className="text-center">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-tighter" style={{ color: 'var(--text)', fontFeatureSettings: '"tnum" 1' }}>
                {report.black.accuracy.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Phase Accuracy — Opening / Middlegame / Endgame */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center text-xs py-1.5 px-3 rounded-md" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span title="Opening phase accuracy">{report.white.phases.opening}%</span>
              <span className="opacity-30">·</span>
              <span title="Middlegame phase accuracy">{report.white.phases.middlegame}%</span>
              <span className="opacity-30">·</span>
              <span title="Endgame phase accuracy">{report.white.phases.endgame !== undefined ? `${report.white.phases.endgame}%` : '—'}</span>
            </div>

            <div className="text-center px-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Open · Mid · End
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 font-mono text-xs">
              <span title="Opening phase accuracy">{report.black.phases.opening}%</span>
              <span className="opacity-30">·</span>
              <span title="Middlegame phase accuracy">{report.black.phases.middlegame}%</span>
              <span className="opacity-30">·</span>
              <span title="Endgame phase accuracy">{report.black.phases.endgame !== undefined ? `${report.black.phases.endgame}%` : '—'}</span>
            </div>
          </div>

          {/* Move Breakdown — inset treatment: bg + padding, no border */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--bg-secondary)'
            }}
          >
            <div className="divide-y divide-[var(--border-subtle)] text-xs">
              {(showFullBreakdown ? breakdownRows : breakdownRows.slice(0, 4)).map((row) => {
                const isClickable = Boolean(onSelectClassificationFilter && (row.white > 0 || row.black > 0))
                return (
                  <div
                    key={row.key}
                    onClick={() => {
                      if (isClickable && onSelectClassificationFilter) {
                        onSelectClassificationFilter(row.key)
                      }
                    }}
                    className={`grid grid-cols-[50px_1fr_50px] items-center py-1 px-3 text-center transition-all ${
                      isClickable ? 'cursor-pointer hover:bg-white/[0.05] active:bg-white/[0.08]' : 'hover:bg-white/[0.02]'
                    }`}
                    style={{
                      opacity: (row.white === 0 && row.black === 0) ? 0.4 : 1
                    }}
                    title={isClickable ? `Filter and view ${row.label} moves` : undefined}
                  >
                    {/* White count */}
                    <span
                      className={`font-mono font-bold text-xs ${row.white > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
                    >
                      {row.white}
                    </span>

                    {/* Move Category */}
                    <div className="flex items-center justify-center gap-1.5">
                      <ClassificationBadge classification={row.key} size={14} />
                      <span className="font-medium text-xs text-[var(--text-secondary)]">{row.label}</span>
                    </div>

                    {/* Black count */}
                    <span
                      className={`font-mono font-bold text-xs ${row.black > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
                    >
                      {row.black}
                    </span>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowFullBreakdown((prev) => !prev)}
              className="w-full py-1 flex items-center justify-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] border-t border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              <span>{showFullBreakdown ? 'Less' : 'More'}</span>
              {showFullBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Game Rating — secondary to Accuracy, but still prominent */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="text-center">
              <div className="font-mono text-xl font-bold tracking-tight" style={{ color: 'var(--accent)', fontFeatureSettings: '"tnum" 1' }}>
                {report.white.gameRating}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                {whiteElo ? `${report.white.gameRating >= whiteElo ? '+' : ''}${report.white.gameRating - whiteElo} vs Elo` : 'Est. Performance'}
              </div>
            </div>

            <div className="text-center px-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Performance
              </span>
            </div>

            <div className="text-center">
              <div className="font-mono text-xl font-bold tracking-tight" style={{ color: 'var(--accent)', fontFeatureSettings: '"tnum" 1' }}>
                {report.black.gameRating}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono">
                {blackElo ? `${report.black.gameRating >= blackElo ? '+' : ''}${report.black.gameRating - blackElo} vs Elo` : 'Est. Performance'}
              </div>
            </div>
          </div>
          </div>
      </div>

      {/* CTA — standalone, no card wrapper */}
      <button
        onClick={onReviewMoves}
        className="w-full py-2.5 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-text)'
        }}
      >
        <Swords className="w-4 h-4" />
        <span>Review Moves on Board</span>
      </button>
    </div>
  )
}
