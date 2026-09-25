import { useState } from 'react'
import { fetchChesscomGames, type ChesscomGameSummary } from '../lib/chesscomApi'
import { SAMPLE_GAMES } from '../lib/pgnParser'
import { Search, FileText, Sparkles, Loader2, Clock, Trophy } from 'lucide-react'

interface GameImportProps {
  onLoadPgn: (pgn: string) => void
  currentLoading: boolean
}

export const GameImport: React.FC<GameImportProps> = ({ onLoadPgn, currentLoading }) => {
  const [activeTab, setActiveTab] = useState<'chesscom' | 'pgn' | 'samples'>('chesscom')
  const [username, setUsername] = useState('')
  const [chesscomGames, setChesscomGames] = useState<ChesscomGameSummary[]>([])
  const [isFetchingChesscom, setIsFetchingChesscom] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [pastedPgn, setPastedPgn] = useState('')

  const handleFetchChesscom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    setIsFetchingChesscom(true)
    setFetchError(null)
    try {
      const games = await fetchChesscomGames(username)
      setChesscomGames(games)
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch games.')
      setChesscomGames([])
    } finally {
      setIsFetchingChesscom(false)
    }
  }

  const tabItems = [
    { id: 'chesscom' as const, label: 'Chess.com', icon: Search },
    { id: 'pgn' as const, label: 'Paste PGN', icon: FileText },
    { id: 'samples' as const, label: 'Samples', icon: Sparkles }
  ]

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {tabItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-all flex-1 justify-center"
            style={{
              background: activeTab === id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === id ? 'var(--text)' : 'var(--text-muted)',
              borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent'
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'chesscom' && (
        <div className="p-4 space-y-3">
          <form onSubmit={handleFetchChesscom} className="flex gap-2">
            <input
              type="text"
              placeholder="Chess.com username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={isFetchingChesscom || !username.trim()}
              className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5 transition-opacity"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {isFetchingChesscom ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching</> : 'Fetch'}
            </button>
          </form>
          {fetchError && (
            <div className="p-3 rounded-md text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              {fetchError}
            </div>
          )}
          {chesscomGames.length > 0 && (
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
              {chesscomGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 rounded-md transition-colors" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{
                          background: game.playerResult === 'win' ? '#81b64c' : game.playerResult === 'loss' ? '#ca3431' : 'var(--text-muted)',
                          color: '#fff'
                        }}
                      >
                        {game.playerResult.toUpperCase()}
                      </span>
                      <span className="font-medium truncate" style={{ color: 'var(--text)' }}>vs {game.opponentUsername} ({game.opponentRating})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{game.timeControl}</span>
                      <span>{game.dateString}</span>
                      <span>{game.playerColor}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onLoadPgn(game.pgn)}
                    disabled={currentLoading}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40 shrink-0"
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
        <form onSubmit={(e) => { e.preventDefault(); if (pastedPgn.trim()) onLoadPgn(pastedPgn.trim()) }} className="p-4 space-y-3">
          <textarea
            rows={6}
            placeholder="Paste PGN text here..."
            value={pastedPgn}
            onChange={(e) => setPastedPgn(e.target.value)}
            className="w-full p-3 rounded-md text-sm resize-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="submit"
            disabled={!pastedPgn.trim() || currentLoading}
            className="w-full py-2.5 rounded-md text-sm font-semibold disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            Load & Analyze
          </button>
        </form>
      )}

      {activeTab === 'samples' && (
        <div className="p-4 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {SAMPLE_GAMES.map((sample, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg border gap-3 transition-all hover:border-[var(--border)]"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex-1 pr-2 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text)' }}>
                  <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="truncate">{sample.title}</span>
                  {(sample as any).category && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-auto sm:ml-0"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--accent)' }}
                    >
                      {(sample as any).category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {sample.desc}
                </p>
              </div>
              <button
                onClick={() => onLoadPgn(sample.pgn)}
                disabled={currentLoading}
                className="px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-40 self-end sm:self-center"
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
