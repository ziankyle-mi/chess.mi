import React, { useState } from 'react'
import {
  type OpponentScoutReport,
  fetchChessComScout,
  fetchLichessScout,
  DEMO_SCOUT_PROFILES
} from '../lib/opponentScout'
import {
  Search,
  Crosshair,
  ShieldAlert,
  Clock,
  Sparkles,
  RotateCcw,
  Play,
  Zap,
  Timer,
  Flame,
  Layers
} from 'lucide-react'

interface OpponentScoutProps {
  onLoadOpeningLine: (pgn: string, openingName: string) => void
}

export const OpponentScout: React.FC<OpponentScoutProps> = ({ onLoadOpeningLine }) => {
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
    <div className="w-full max-w-[1240px] mx-auto py-2 px-3 sm:px-6 flex flex-col gap-6 select-none font-sans">
      {/* Header & Search Control */}
      <div
        className="w-full rounded-xl p-4 sm:p-5 flex flex-col gap-4"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text)]">
                Opponent Tournament Scout
              </h2>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold tracking-wider uppercase"
                style={{ background: 'var(--bg-secondary)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}
              >
                Pre-Game Prep
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Scout your opponent's opening repertoire, identify their go-to 1st moves, and target their weakest lines.
            </p>
          </div>

          {/* Quick Demo profiles */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] text-[var(--text-muted)]">Demo Profiles:</span>
            <button
              onClick={() => loadDemo('hikaru')}
              className="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
            >
              Hikaru (3400)
            </button>
            <button
              onClick={() => loadDemo('clubplayer')}
              className="px-2.5 py-1 rounded text-xs font-mono font-medium transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
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
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          {/* Platform switch */}
          <div className="flex items-center rounded-lg p-0.5 shrink-0" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setPlatform('chesscom')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
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
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: platform === 'lichess' ? 'var(--bg-elevated)' : 'transparent',
                color: platform === 'lichess' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: platform === 'lichess' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              Lichess
            </button>
          </div>

          {/* Time control selector */}
          <div className="flex items-center rounded-lg p-0.5 shrink-0" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'all' as const, label: 'All', icon: Layers },
              { id: 'blitz' as const, label: 'Blitz', icon: Zap },
              { id: 'rapid' as const, label: 'Rapid', icon: Timer },
              { id: 'bullet' as const, label: 'Bullet', icon: Flame }
            ].map(({ id: tc, label, icon: Icon }) => {
              const active = timeControl === tc
              return (
                <button
                  key={tc}
                  type="button"
                  onClick={() => {
                    setTimeControl(tc)
                    handleSearch(username, platform, tc)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: active ? 'var(--accent)' : 'inherit' }} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Username Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter opponent's username (e.g. MagnusCarlsen)"
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs font-mono transition-all outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text)'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              boxShadow: '0 2px 8px rgba(129, 182, 76, 0.25)'
            }}
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Scouting...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5" />
                <span>Scout Opponent</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <div className="text-xs px-3 py-2 rounded-md font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Scout Results Dashboard */}
      {report && (
        <div className="flex flex-col gap-6">
          {/* Opponent Profile Banner */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Target Opponent</span>
              <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                <span className="text-base sm:text-lg font-bold font-mono text-[var(--text)]">{report.username}</span>
                {report.rating && (
                  <span className="text-xs font-mono font-semibold text-[var(--accent)]">{report.rating} Elo</span>
                )}
                <div
                  className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}
                >
                  {report.timeControl === 'blitz' && <Zap className="w-3 h-3" />}
                  {report.timeControl === 'rapid' && <Timer className="w-3 h-3" />}
                  {report.timeControl === 'bullet' && <Flame className="w-3 h-3" />}
                  {report.timeControl === 'all' && <Layers className="w-3 h-3" />}
                  <span>{report.timeControl === 'all' ? 'All Speeds' : report.timeControl}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Win / Draw / Loss</span>
              <div className="flex items-baseline gap-1 mt-0.5 font-mono text-sm font-semibold">
                <span className="text-[#81b64c]">{report.wins}W</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-muted)]">{report.draws}D</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[#ef4444]">{report.losses}L</span>
                <span className="text-[11px] text-[var(--text-muted)] ml-1">({report.overallWinRate}%)</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Playstyle Profile</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text)]">{report.playstyle}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Game Pace & Danger</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="text-xs font-mono text-[var(--text-secondary)]">~{report.avgGameLength} moves avg</span>
              </div>
            </div>
          </div>

          {/* Achilles' Heel / Vulnerability Card */}
          {report.achillesHeels.length > 0 && (
            <div
              className="rounded-xl p-4 sm:p-5 flex flex-col gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, var(--bg-elevated) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ef4444]">
                    Achilles' Heel (Target Their Weakness)
                  </h3>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Statistically lowest win rate
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {report.achillesHeels.map((heel, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg flex flex-col justify-between gap-2"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[var(--text)]">{heel.openingName}</span>
                        <span className="text-[11px] font-mono font-bold text-[#ef4444]">
                          {heel.lossRate}% Loss Rate
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        {heel.advice}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {heel.movesSan.join(' ')}
                      </span>
                      <button
                        onClick={() => onLoadOpeningLine(heel.pgn, heel.openingName)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Prep on Board</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repertoire Breakdown: White vs Black */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* When Opponent Plays White */}
            <div
              className="rounded-xl p-4 sm:p-5 flex flex-col gap-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white border border-gray-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    When Opponent Plays White
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent)' }}>
                  {report.whiteRepertoire.winRate}% Win Rate ({report.whiteRepertoire.totalGames} games)
                </span>
              </div>

              {/* White 1st Move Distribution */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Primary 1st Move
                </span>
                <div className="flex flex-col gap-1.5">
                  {report.whiteRepertoire.firstMoves.map((m, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-2 rounded" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[var(--text)]">{m.move}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--text-secondary)]">{m.frequency}% of games ({m.count})</span>
                          <span className={`font-semibold ${m.winRate >= 55 ? 'text-[#81b64c]' : 'text-[var(--text-muted)]'}`}>
                            {m.winRate}% Win
                          </span>
                        </div>
                      </div>
                      {/* Frequency Bar */}
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m.frequency}%`,
                            background: idx === 0 ? 'var(--accent)' : 'var(--text-muted)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* White Top Opening Systems */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Favorite White Openings
                </span>
                <div className="divide-y divide-[var(--border-subtle)] text-xs">
                  {report.whiteRepertoire.topSystems.map((sys, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate text-[var(--text)]">{sys.name}</span>
                          {sys.eco && <span className="text-[10px] font-mono text-[var(--text-muted)]">{sys.eco}</span>}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                          {sys.movesSan.slice(0, 6).join(' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono text-xs">
                          <span className="font-bold text-[var(--text)]">{sys.winRate}%</span>
                          <span className="text-[10px] text-[var(--text-muted)] block">{sys.count} games</span>
                        </div>
                        <button
                          onClick={() => onLoadOpeningLine(sys.pgn, sys.name)}
                          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                          title="Practice this line on board"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* When Opponent Plays Black */}
            <div
              className="rounded-xl p-4 sm:p-5 flex flex-col gap-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-black border border-gray-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                    When Opponent Plays Black
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold" style={{ color: 'var(--accent)' }}>
                  {report.blackRepertoire.winRate}% Win Rate ({report.blackRepertoire.totalGames} games)
                </span>
              </div>

              {/* Black Responses vs 1.e4 */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Defense Against 1. e4
                </span>
                <div className="flex flex-col gap-1.5">
                  {report.blackRepertoire.vsE4.map((m, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-2 rounded" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[var(--text)]">{m.move}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--text-secondary)]">{m.frequency}% ({m.count})</span>
                          <span className={`font-semibold ${m.winRate >= 50 ? 'text-[#81b64c]' : 'text-[var(--text-muted)]'}`}>
                            {m.winRate}% Win
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m.frequency}%`,
                            background: idx === 0 ? 'var(--accent)' : 'var(--text-muted)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Black Responses vs 1.d4 */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Defense Against 1. d4
                </span>
                <div className="flex flex-col gap-1.5">
                  {report.blackRepertoire.vsD4.map((m, idx) => (
                    <div key={idx} className="flex flex-col gap-1 p-2 rounded" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-[var(--text)]">{m.move}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--text-secondary)]">{m.frequency}% ({m.count})</span>
                          <span className={`font-semibold ${m.winRate >= 50 ? 'text-[#81b64c]' : 'text-[var(--text-muted)]'}`}>
                            {m.winRate}% Win
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${m.frequency}%`,
                            background: idx === 0 ? 'var(--accent)' : 'var(--text-muted)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Black Top Opening Systems */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Favorite Black Openings
                </span>
                <div className="divide-y divide-[var(--border-subtle)] text-xs">
                  {report.blackRepertoire.topSystems.map((sys, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate text-[var(--text)]">{sys.name}</span>
                          {sys.eco && <span className="text-[10px] font-mono text-[var(--text-muted)]">{sys.eco}</span>}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                          {sys.movesSan.slice(0, 6).join(' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono text-xs">
                          <span className="font-bold text-[var(--text)]">{sys.winRate}%</span>
                          <span className="text-[10px] text-[var(--text-muted)] block">{sys.count} games</span>
                        </div>
                        <button
                          onClick={() => onLoadOpeningLine(sys.pgn, sys.name)}
                          className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                          title="Practice this line on board"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
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
