import React from 'react'
import type { CapturedPieces } from '../lib/chessUtils'

interface PlayerCardProps {
  name: string
  elo?: string
  performanceRating?: number
  side: 'White' | 'Black'
  captured: CapturedPieces
  materialAdvantage: number // > 0 means this player is up
  isTurn: boolean
  inCheck: boolean
}

// Crisp piece glyphs
const BLACK_PIECE_SYMBOLS: Record<keyof CapturedPieces, string> = {
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟'
}

const WHITE_PIECE_SYMBOLS: Record<keyof CapturedPieces, string> = {
  q: '♕',
  r: '♖',
  b: '♗',
  n: '♘',
  p: '♙'
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  elo,
  performanceRating,
  side,
  captured,
  materialAdvantage,
  isTurn,
  inCheck
}) => {
  const isWhite = side === 'White'
  const glyphMap = isWhite ? BLACK_PIECE_SYMBOLS : WHITE_PIECE_SYMBOLS

  // Build ordered list of captured pieces with counts: Q, R, B, N, P
  const pieceOrder: (keyof CapturedPieces)[] = ['q', 'r', 'b', 'n', 'p']
  const capturedList = pieceOrder
    .map((type) => ({ type, count: captured[type] }))
    .filter((item) => item.count > 0)

  return (
    <div
      className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all select-none"
      style={{
        background: isTurn ? 'var(--bg-elevated)' : 'transparent',
        border: isTurn ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: isTurn ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
      }}
    >
      {/* Left: Player Identity & Turn status */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Side Indicator / Avatar */}
        <div
          className="relative w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-transform"
          style={{
            background: isWhite ? '#f0f0f0' : '#262421',
            color: isWhite ? '#262421' : '#f0f0f0',
            border: isWhite ? '1px solid #d5d3d0' : '1px solid #403d39',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        >
          <span>{isWhite ? '♔' : '♚'}</span>
          {isTurn && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg)] animate-pulse"
              style={{ background: inCheck ? '#ef4444' : 'var(--accent)' }}
              title={inCheck ? 'In Check!' : `${side} to move`}
            />
          )}
        </div>

        {/* Player Name and Elo */}
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span
            className="text-[13px] font-semibold truncate"
            style={{ color: isTurn ? 'var(--text)' : 'var(--text-secondary)' }}
          >
            {name || (isWhite ? 'White' : 'Black')}
          </span>
          {elo && (
            <span
              className="text-[11px] font-mono shrink-0 px-1 py-0.2 rounded"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
            >
              {elo}
            </span>
          )}
          {performanceRating && (
            <span
              className="text-[10px] font-mono shrink-0 px-1.5 py-0.2 rounded font-semibold tracking-tight"
              style={{ background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}
              title={`Estimated Performance Rating: ${performanceRating}`}
            >
              {performanceRating} perf
            </span>
          )}
          {inCheck && isTurn && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.2 rounded tracking-wider uppercase shrink-0 animate-pulse"
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}
            >
              Check
            </span>
          )}
        </div>
      </div>

      {/* Right: Captured Pieces Tray & Material Advantage */}
      <div className="flex items-center gap-2 shrink-0 pl-2">
        {/* Captured pieces */}
        <div className="flex items-center gap-1" style={{ color: isWhite ? '#9ca3af' : '#e5e7eb' }}>
          {capturedList.map(({ type, count }) => (
            <span
              key={type}
              className="flex items-center font-serif text-[15px] leading-none"
              title={`${count} ${type.toUpperCase()}`}
            >
              <span>{glyphMap[type]}</span>
              {count > 1 && (
                <span className="text-[10px] font-mono font-medium -ml-0.5 opacity-80">
                  {count}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Material Advantage Badge (+1, +3, etc.) */}
        {materialAdvantage > 0 && (
          <span
            className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded leading-none"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
            title={`+${materialAdvantage} Material Advantage`}
          >
            +{materialAdvantage}
          </span>
        )}
      </div>
    </div>
  )
}
