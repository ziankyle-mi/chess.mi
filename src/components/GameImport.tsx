import { useState } from 'react'
import {
  fetchChesscomGames,
  fetchLichessUserGames,
  type ChesscomGameSummary,
  type TimeControlFilter
} from '../lib/chesscomApi'
import { SAMPLE_GAMES } from '../lib/pgnParser'
import {
  Search,
  FileText,
  Loader2,
  Clock,
  Zap,
  Timer,
  Flame,
  Layers
} from 'lucide-react'

interface GameImportProps {
  onLoadPgn: (pgn: string) => void
  currentLoading: boolean
}

export const GameImport: React.FC<GameImportProps> = ({ onLoadPgn, currentLoading }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'pgn' | 'samples'>('online')
  const [platform, setPlatform] = useState<'chesscom' | 'lichess'>('chesscom')
  const [timeControl, setTimeControl] = useState<TimeControlFilter>('all')
  const [username, setUsername] = useState('')
  const [fetchedGames, setFetchedGames] = useState<ChesscomGameSummary[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [pastedPgn, setPastedPgn] = useState('')

  const handleFetch = async (
    userToFetch = username,
    platToFetch = platform,
    tcToFetch = timeControl
  ) => {
    const clean = userToFetch.trim()
    if (!clean) return

    setIsFetching(true)
    setFetchError(null)

    try {
      if (platToFetch === 'chesscom') {
        const games = await fetchChesscomGames(clean, tcToFetch)
        setFetchedGames(games)
      } else {
        const games = await fetchLichessUserGames(clean, tcToFetch)
        setFetchedGames(games)
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch games.')
      setFetchedGames([])
    } finally {
      setIsFetching(false)
    }
  }

  const tabItems = [
    { id: 'online' as const, label: 'Chess.com / Lichess', icon: Search },
    { id: 'pgn' as const, label: 'Paste PGN', icon: FileText },
    { id: 'samples' as const, label: 'Samples' }
  ]

  return (
    <div className="rounded-xl overflow-hidden shadow-lg select-none font-sans" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
      {/* Top Tab Bar */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {tabItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-all flex-1 justify-center cursor-pointer"
            style={{
              background: activeTab === id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === id ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent'
            }}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'online' && (
        <div className="p-4 sm:p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleFetch()
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            {/* Platform toggle */}
            <div className="flex items-center rounded-lg p-0.5 shrink-0" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  setPlatform('chesscom')
                  if (username.trim()) handleFetch(username, 'chesscom', timeControl)
                }}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
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
                onClick={() => {
                  setPlatform('lichess')
                  if (username.trim()) handleFetch(username, 'lichess', timeControl)
                }}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: platform === 'lichess' ? 'var(--bg-elevated)' : 'transparent',
                  color: platform === 'lichess' ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: platform === 'lichess' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                Lichess
              </button>
            </div>

            {/* Time Control Filter */}
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
                      if (username.trim()) handleFetch(username, platform, tc)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer"
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
              <input
                type="text"
                placeholder={platform === 'chesscom' ? 'Chess.com username (e.g. Hikaru)' : 'Lichess username (e.g. DrNykterstein)'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text)'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              />
            </div>

            {/* Fetch Button */}
            <button
              type="submit"
              disabled={isFetching || !username.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Fetch Games</span>
              )}
            </button>
          </form>

          {fetchError && (
            <div className="p-3 rounded-lg text-xs font-medium" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              {fetchError}
            </div>
          )}

          {fetchedGames.length > 0 && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {fetchedGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 rounded-lg border transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="text-xs font-semibold font-mono"
                        style={{
                          color: game.playerResult === 'win' ? '#81b64c' : game.playerResult === 'loss' ? '#ef4444' : 'var(--text-muted)'
                        }}
                      >
                        {game.playerResult === 'win' ? 'Win' : game.playerResult === 'loss' ? 'Loss' : 'Draw'}
                      </span>
                      <span className="font-semibold truncate text-[var(--text)]">
                        vs {game.opponentUsername} ({game.opponentRating})
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.2 rounded text-[var(--text-muted)] shrink-0 hidden sm:inline"
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        {game.platform === 'chesscom' ? 'Chess.com' : 'Lichess'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
                        {game.timeClass.toLowerCase() === 'blitz' && <Zap className="w-3 h-3" />}
                        {game.timeClass.toLowerCase() === 'rapid' && <Timer className="w-3 h-3" />}
                        {game.timeClass.toLowerCase() === 'bullet' && <Flame className="w-3 h-3" />}
                        {!['blitz', 'rapid', 'bullet'].includes(game.timeClass.toLowerCase()) && <Clock className="w-3 h-3" />}
                        <span className="capitalize">{game.timeClass} ({game.timeControl})</span>
                      </span>
                      <span>{game.dateString}</span>
                      <span className="capitalize">{game.playerColor}</span>
                      {game.eco && <span className="truncate max-w-[140px] text-[var(--text-secondary)]">{game.eco}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onLoadPgn(game.pgn)}
                    disabled={currentLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 shrink-0 cursor-pointer shadow-sm active:scale-95"
                    style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    Analyze
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pgn' && (
        <form onSubmit={(e) => { e.preventDefault(); if (pastedPgn.trim()) onLoadPgn(pastedPgn.trim()) }} className="p-4 sm:p-5 space-y-3">
          <textarea
            rows={6}
            placeholder="Paste PGN text here..."
            value={pastedPgn}
            onChange={(e) => setPastedPgn(e.target.value)}
            className="w-full p-3 rounded-lg text-xs resize-none outline-none font-mono"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
          />
          <button
            type="submit"
            disabled={!pastedPgn.trim() || currentLoading}
            className="w-full py-2.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-all cursor-pointer shadow-sm"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Load & Analyze
          </button>
        </form>
      )}

      {activeTab === 'samples' && (
        <div className="p-4 sm:p-5 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {SAMPLE_GAMES.map((sample, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border gap-3 transition-all"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex-1 pr-2 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text)' }}>
                  <span className="truncate">{sample.title}</span>
                  {(sample as any).category && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-auto sm:ml-0 font-mono"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                    >
                      {(sample as any).category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed text-[var(--text-muted)]">
                  {sample.desc}
                </p>
              </div>
              <button
                onClick={() => onLoadPgn(sample.pgn)}
                disabled={currentLoading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-40 self-end sm:self-center"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Load Game
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
