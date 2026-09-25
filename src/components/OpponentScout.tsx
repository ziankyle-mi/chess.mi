import React, { useState } from 'react'
import {
  type OpponentScoutReport,
  type MoveStat,
  type OpeningSystemStat,
  fetchChessComScout,
  fetchLichessScout,
  DEMO_SCOUT_PROFILES
} from '../lib/opponentScout'
import { useTheme } from '../lib/ThemeContext'
import { getSampleConfidence } from '../lib/confidence'
import { Search, RotateCcw, Play } from 'lucide-react'

interface OpponentScoutProps {
  onLoadOpeningLine: (pgn: string, openingName: string) => void
}

const MoveStatRow: React.FC<{
  stat: MoveStat
  boardDark: string
}> = ({ stat, boardDark }) => {
  const isLowSample = stat.count < 4
  const isHighSample = stat.count >= 8

  return (
    <div
      className={`flex flex-col gap-1 py-1.5 px-2 rounded transition-opacity ${isLowSample ? 'opacity-75' : ''}`}
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`font-semibold truncate ${isLowSample ? 'text-[var(--text-secondary)]' : 'text-[var(--text)]'}`}>
            {stat.move}
          </span>
          {isLowSample && (
            <span className="text-[10px] text-[var(--text-muted)] font-sans italic">
              early read
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[var(--text-muted)] text-[11px]">
            {stat.frequency}% ({stat.count} {stat.count === 1 ? 'game' : 'games'})
          </span>
          <span className={`font-semibold ${stat.winRate >= 55 ? 'text-[#81b64c]' : 'text-[var(--text-muted)]'}`}>
            {stat.winRate}% W
          </span>
        </div>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${stat.frequency}%`,
            background: isLowSample ? 'var(--text-muted)' : boardDark || 'var(--accent)',
            opacity: isHighSample ? 1 : isLowSample ? 0.4 : 0.8
          }}
        />
      </div>
    </div>
  )
}

const OpeningSystemRow: React.FC<{
  sys: OpeningSystemStat
  onLoad: (pgn: string, name: string) => void
}> = ({ sys, onLoad }) => {
  const isLowSample = sys.count < 4

  return (
    <div className={`py-2 flex items-center justify-between gap-2 transition-opacity ${isLowSample ? 'opacity-80' : ''}`}>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold truncate ${isLowSample ? 'text-[var(--text-secondary)]' : 'text-[var(--text)]'}`}>
            {sys.name}
          </span>
          {sys.eco && <span className="text-[10px] font-mono text-[var(--text-muted)]">{sys.eco}</span>}
          {isLowSample && (
            <span className="text-[10px] text-[var(--text-muted)] font-sans italic">
              (early read)
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
          {sys.movesSan.slice(0, 6).join(' ')}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right font-mono text-xs">
          <span className="font-semibold text-[var(--text)]">{sys.winRate}% W</span>
          <span className="text-[10px] text-[var(--text-muted)] block">
            {sys.count} {sys.count === 1 ? 'game' : 'games'}
          </span>
        </div>
        <button
          onClick={() => onLoad(sys.pgn, sys.name)}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
          title="Practice this line on board"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  )
}

export const OpponentScout: React.FC<OpponentScoutProps> = ({ onLoadOpeningLine }) => {
  const { boardTheme } = useTheme()
  const [username, setUsername] = useState('Hikaru')
  const [platform, setPlatform] = useState<'chesscom' | 'lichess'>('chesscom')
  const [timeControl, setTimeControl] = useState<'all' | 'blitz' | 'rapid' | 'bullet'>('all')
  const [report, setReport] = useState<OpponentScoutReport>(DEMO_SCOUT_PROFILES.hikaru)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSearch = async (
    userToSearch = username,
    platToSearch = platform,
    tcToSearch = timeControl
  ) => {
    const trimmed = userToSearch.trim()
    if (!trimmed) return

    // Quick demo matching
    const lower = trimmed.toLowerCase()
    if (lower === 'hikaru' && platToSearch === 'chesscom' && tcToSearch === 'all') {
      setReport(DEMO_SCOUT_PROFILES.hikaru)
      setErrorMsg(null)
      return
    }
    if ((lower === 'club' || lower.includes('1600') || lower.includes('clubwarrior')) && tcToSearch === 'all') {
      setReport(DEMO_SCOUT_PROFILES.clubplayer)
      setErrorMsg(null)
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      if (platToSearch === 'chesscom') {
        const data = await fetchChessComScout(trimmed, 40, tcToSearch)
        setReport(data)
      } else {
        const data = await fetchLichessScout(trimmed, 40, tcToSearch)
        setReport(data)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch opponent games. Check username or try demo.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDemo = (key: 'hikaru' | 'clubplayer') => {
    const demo = DEMO_SCOUT_PROFILES[key]
    setUsername(demo.username)
    setPlatform(demo.platform)
    setReport(demo)
    setErrorMsg(null)
  }

  return (
    <div className="w-full max-w-[1240px] mx-auto py-2 px-3 sm:px-6 flex flex-col gap-4 select-none font-sans">
      {/* Search & Control Bar */}
      <div
        className="w-full rounded-xl p-3.5 sm:p-4 flex flex-col gap-3"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-[var(--text)]">
              Opponent Scout
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Repertoire distribution and tactical vulnerabilities
            </p>
          </div>

          {/* Quick Demo profiles */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[var(--text-muted)]">Demo:</span>
            <button
              onClick={() => loadDemo('hikaru')}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium transition-all cursor-pointer"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border-subtle)' }}
            >
              Hikaru (3400)
            </button>
            <button
              onClick={() => loadDemo('clubplayer')}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium transition-all cursor-pointer"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border-subtle)' }}
            >
              Club Player (1600)
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          {/* Platform toggle */}
          <div className="flex items-center rounded-lg p-0.5 shrink-0" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setPlatform('chesscom')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: platform === 'chesscom' ? 'var(--bg-elevated)' : 'transparent',
                color: platform === 'chesscom' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: platform === 'chesscom' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              Chess.com
            </button>
            <button
              type="button"
              onClick={() => setPlatform('lichess')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
              style={{
                background: platform === 'lichess' ? 'var(--bg-elevated)' : 'transparent',
                color: platform === 'lichess' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: platform === 'lichess' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              Lichess
            </button>
          </div>

          {/* Time control toggle */}
          <div className="flex items-center rounded-lg p-0.5 shrink-0" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {(['all', 'blitz', 'rapid', 'bullet'] as const).map((tc) => {
              const active = timeControl === tc
              return (
                <button
                  key={tc}
                  type="button"
                  onClick={() => {
                    setTimeControl(tc)
                    handleSearch(username, platform, tc)
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer"
                  style={{
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  {tc === 'all' ? 'All' : tc}
                </button>
              )
            })}
          </div>

          {/* Username Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-mono transition-all outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text)'
              }}
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)'
            }}
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-3 h-3 animate-spin" />
                <span>Scouting...</span>
              </>
            ) : (
              <span>Scout</span>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Scout Results */}
      {report && (
        <div className="flex flex-col gap-4">
          {/* Opponent Profile Header: True Hierarchy */}
          <div
            className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-[var(--text)]">
                {report.username}
              </span>
              {report.rating && (
                <span className="text-sm font-mono font-semibold text-[var(--text-secondary)]">
                  {report.rating} Elo
                </span>
              )}
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {report.platform === 'chesscom' ? 'Chess.com' : 'Lichess'} · {report.timeControl === 'all' ? 'All Speeds' : report.timeControl}
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono flex-wrap">
              <div>
                <span className="text-[var(--text-muted)]">Record: </span>
                <span className="font-semibold text-[var(--text)]">
                  <span className="text-[#81b64c]">{report.wins}W</span>
                  <span className="text-[var(--text-muted)]"> · </span>
                  <span>{report.draws}D</span>
                  <span className="text-[var(--text-muted)]"> · </span>
                  <span className="text-[#ef4444]">{report.losses}L</span>
                </span>
                <span className="text-[var(--text-muted)] ml-1 font-normal">
                  ({report.overallWinRate}% over {report.totalGames} games
                  {report.totalGames < 10 ? ' · early read' : ''})
                </span>
              </div>
              <span className="text-[var(--border-subtle)] hidden sm:inline">|</span>
              <div>
                <span className="text-[var(--text-muted)]">Style: </span>
                <span className="font-medium text-[var(--text)]">{report.playstyle}</span>
              </div>
              <span className="text-[var(--border-subtle)] hidden sm:inline">|</span>
              <div>
                <span className="text-[var(--text-muted)]">Avg: </span>
                <span className="font-medium text-[var(--text-secondary)]">~{report.avgGameLength} moves</span>
              </div>
            </div>
          </div>

          {/* Achilles' Heel / Key Vulnerability Callout: Tight singular emphasis */}
          {report.achillesHeels.length > 0 && (
            <div
              className="rounded-lg p-3.5 sm:p-4 flex flex-col gap-3"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid #ef4444'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--text)]">
                  Key vulnerabilities
                </h3>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Statistically lowest win rate
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {report.achillesHeels.map((heel, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md flex flex-col justify-between gap-2"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      opacity: heel.gamesCount < 5 ? 0.9 : 1
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[var(--text)]">{heel.openingName}</span>
                        <span className="text-[11px] font-mono font-bold text-[#ef4444]">
                          {heel.lossRate}% Loss Rate ({heel.gamesCount} games
                          {heel.gamesCount < 5 ? ' · early read' : ''})
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {heel.advice}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[200px]">
                        {heel.movesSan.join(' ')}
                      </span>
                      <button
                        onClick={() => onLoadOpeningLine(heel.pgn, heel.openingName)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer shrink-0"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Prep Line</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repertoire Breakdown: Quiet, structured ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* White Repertoire */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3.5"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-400" />
                  <h3 className="text-xs font-semibold text-[var(--text)]">
                    When playing White
                  </h3>
                </div>
                <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                  {report.whiteRepertoire.winRate}% W · {getSampleConfidence(report.whiteRepertoire.totalGames).caption}
                </span>
              </div>

              {/* 1st Move Distribution */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Primary first move
                </span>
                <div className="flex flex-col gap-1">
                  {report.whiteRepertoire.firstMoves.map((m, idx) => (
                    <MoveStatRow key={idx} stat={m} boardDark={boardTheme.darkSquare} />
                  ))}
                </div>
              </div>

              {/* Top Systems */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Favorite White openings
                </span>
                <div className="divide-y divide-[var(--border-subtle)] text-xs">
                  {report.whiteRepertoire.topSystems.map((sys, idx) => (
                    <OpeningSystemRow key={idx} sys={sys} onLoad={onLoadOpeningLine} />
                  ))}
                </div>
              </div>
            </div>

            {/* Black Repertoire */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3.5"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-black border border-gray-600" />
                  <h3 className="text-xs font-semibold text-[var(--text)]">
                    When playing Black
                  </h3>
                </div>
                <span className="text-xs font-mono font-medium text-[var(--text-secondary)]">
                  {report.blackRepertoire.winRate}% W · {getSampleConfidence(report.blackRepertoire.totalGames).caption}
                </span>
              </div>

              {/* Black Defense vs 1.e4 */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Defense vs 1. e4
                </span>
                <div className="flex flex-col gap-1">
                  {report.blackRepertoire.vsE4.map((m, idx) => (
                    <MoveStatRow key={idx} stat={m} boardDark={boardTheme.darkSquare} />
                  ))}
                </div>
              </div>

              {/* Black Defense vs 1.d4 */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Defense vs 1. d4
                </span>
                <div className="flex flex-col gap-1">
                  {report.blackRepertoire.vsD4.map((m, idx) => (
                    <MoveStatRow key={idx} stat={m} boardDark={boardTheme.darkSquare} />
                  ))}
                </div>
              </div>

              {/* Top Systems */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Favorite Black openings
                </span>
                <div className="divide-y divide-[var(--border-subtle)] text-xs">
                  {report.blackRepertoire.topSystems.map((sys, idx) => (
                    <OpeningSystemRow key={idx} sys={sys} onLoad={onLoadOpeningLine} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
