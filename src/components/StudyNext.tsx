import React, { useState, useRef } from 'react'
import {
  Compass,
  Target,
  User,
  Sparkles,
  ShieldCheck,
  Crosshair,
  Check,
  BookOpen,
  Swords,
  Crown,
  Edit2,
  RefreshCw,
  Loader2,
  History,
  ArrowRight
} from 'lucide-react'
import {
  type AggregateStats,
  type AnalyzedGameRecord
} from '../lib/progressStore'
import { syncChesscom20Games } from '../lib/chesscomApi'

interface StudyNextProps {
  nudge: string
  topPattern: { pattern: string; count: number; percentage: number } | null
  avgAcpl: number
  avgElo: number
  analyzedCount: number
  userAccount: string
  onUpdateUserAccount: (name: string) => void
  aggregateStats: AggregateStats
  currentGameWhite?: string
  currentGameBlack?: string
  onBatchSync?: (records: AnalyzedGameRecord[]) => void
  onLoadPgn?: (pgn: string) => void
}

export const StudyNext: React.FC<StudyNextProps> = ({
  nudge,
  topPattern,
  avgAcpl,
  avgElo,
  analyzedCount,
  userAccount,
  onUpdateUserAccount,
  aggregateStats,
  currentGameWhite,
  currentGameBlack,
  onBatchSync,
  onLoadPgn
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(!userAccount)
  const [inputUsername, setInputUsername] = useState<string>(userAccount || '')
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [syncStatus, setSyncStatus] = useState<string>('')
  const [syncError, setSyncError] = useState<string | null>(null)
  const cancelSyncRef = useRef<boolean>(false)

  const handleSync20Games = async (targetUser?: string) => {
    const userToSync = targetUser || userAccount.trim()
    if (!userToSync || isSyncing) return
    setIsSyncing(true)
    setSyncError(null)
    setSyncStatus('Connecting to Chess.com archives...')

    try {
      const updated = await syncChesscom20Games(userToSync, (msg) => setSyncStatus(msg))
      if (onBatchSync) {
        onBatchSync(updated)
      }
    } catch (err: any) {
      setSyncError(err.message || 'Failed to sync games.')
    } finally {
      setIsSyncing(false)
      setSyncStatus('')
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputUsername.trim()
    if (!trimmed) return
    onUpdateUserAccount(trimmed)
    setIsEditing(false)
    handleSync20Games(trimmed)
  }

  const handleQuickSelect = (name: string) => {
    setInputUsername(name)
    onUpdateUserAccount(name)
    setIsEditing(false)
    handleSync20Games(name)
  }

  const userStats = aggregateStats.userStats

  return (
    <div className="w-full flex flex-col gap-5 select-none font-sans max-w-4xl mx-auto">
      {/* Account Setup / Header Card */}
      <div
        className="rounded-xl p-5 border shadow-sm flex flex-col gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                Personalized Chess Coach
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Game phase analysis, tactical leaks, and custom study plans
              </p>
            </div>
          </div>

          {userAccount && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Change Account</span>
            </button>
          )}
        </div>

        {/* Account Linking State */}
        {isEditing ? (
          <div
            className="p-4 rounded-lg flex flex-col gap-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--text)]">
                Link Your Account to Track Strengths & Weaknesses
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Enter your Chess.com, Lichess, or tournament username. The coach will isolate your moves across all analyzed games to diagnose your openings, middlegames, and endgames.
            </p>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. ziankyle_m"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="flex-1 px-3 py-2 rounded-md text-xs sm:text-sm font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)'
                }}
              />
              <button
                type="submit"
                disabled={!inputUsername.trim()}
                className="px-4 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Track Account
              </button>
            </form>

            {/* Quick Suggestions from Current Game */}
            {(currentGameWhite || currentGameBlack) && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-[var(--text-muted)]">Detected in current game:</span>
                {currentGameWhite && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(currentGameWhite)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    ♔ {currentGameWhite} (White)
                  </button>
                )}
                {currentGameBlack && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(currentGameBlack)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    ♚ {currentGameBlack} (Black)
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className="p-3 sm:p-4 rounded-lg flex flex-col gap-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-sm shrink-0"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  {(userAccount[0] || 'U').toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text)]">{userAccount}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-mono font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-elevated)]"
                    >
                      Rolling 20 FIFO
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                    {userStats ? `${userStats.gamesPlayed} of 20 games tracked` : `${analyzedCount} total games in library`}
                  </span>
                </div>
              </div>

              {/* Sync 20 Games Action */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSync20Games()}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                  title="Fetch and analyze your latest 20 games from Chess.com into your 20-game rolling window"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Latest 20 Games</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Progress / Status Banner */}
            {isSyncing && (
              <div className="w-full px-3.5 py-2.5 rounded-lg flex items-center justify-between text-xs bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text)] shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)] shrink-0" />
                  <span className="font-medium truncate">{syncStatus}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { cancelSyncRef.current = true }}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline cursor-pointer shrink-0 ml-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {syncError && (
              <div className="w-full px-3 py-2 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400">
                {syncError}
              </div>
            )}

            {/* Quick Performance Metrics */}
            {userStats ? (
              <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end pt-1">
                <div className="text-center px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="block text-[10px] text-[var(--text-muted)] font-medium">Record (20G)</span>
                  <span className="font-mono font-bold text-xs text-[var(--text)]">
                    {userStats.wins}W - {userStats.losses}L - {userStats.draws}D
                  </span>
                </div>
                <div className="text-center px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="block text-[10px] text-[var(--text-muted)] font-medium">Win Rate</span>
                  <span className="font-mono font-bold text-xs text-[var(--accent)]">
                    {userStats.winRate}%
                  </span>
                </div>
                <div className="text-center px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="block text-[10px] text-[var(--text-muted)] font-medium">Avg Accuracy</span>
                  <span className="font-mono font-bold text-xs text-[var(--text)]">
                    {userStats.avgAccuracy}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-center px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="block text-[10px] text-[var(--text-muted)] font-medium">Avg Loss</span>
                  <span className="font-mono font-bold text-xs text-[var(--text)]">
                    {avgAcpl} cp
                  </span>
                </div>
                <div className="text-center px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="block text-[10px] text-[var(--text-muted)] font-medium">Avg Elo</span>
                  <span className="font-mono font-bold text-xs text-[var(--accent)]">
                    {avgElo}
                  </span>
                </div>
                {topPattern && (
                  <div className="text-center px-3 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <span className="block text-[10px] text-[var(--text-muted)] font-medium">Top Leak</span>
                    <span className="font-mono font-bold text-xs text-[var(--text)]">
                      {topPattern.pattern}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Phase Performance Diagnosis */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
            <Compass className="w-4 h-4 text-[var(--accent)]" />
            <span>Phase Performance Diagnosis</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Opening (1–12) · Middlegame (13–30) · Endgame (31+)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              key: 'opening' as const,
              title: 'Opening',
              icon: BookOpen,
              data: userStats?.phases.opening || {
                accuracy: 88.5,
                blunders: 0,
                movesCount: 240,
                status: 'strong' as const,
                statusLabel: 'Strongest Phase',
                summary: 'Solid opening principles. Controls central squares and develops pieces efficiently.'
              }
            },
            {
              key: 'middlegame' as const,
              title: 'Middlegame',
              icon: Swords,
              data: userStats?.phases.middlegame || {
                accuracy: 74.2,
                blunders: 2,
                movesCount: 380,
                status: 'weak' as const,
                statusLabel: 'Primary Focus',
                summary: 'Complex tactical skirmishes cause rating drops. Calculation slips during open trades.'
              }
            },
            {
              key: 'endgame' as const,
              title: 'Endgame',
              icon: Crown,
              data: userStats?.phases.endgame || {
                accuracy: 82.8,
                blunders: 0,
                movesCount: 160,
                status: 'solid' as const,
                statusLabel: 'Developing',
                summary: 'Reliable conversion in simplified positions with strong king activation.'
              }
            }
          ].map((phase) => {
            const isFocus = phase.data.status === 'weak'
            const isStrong = phase.data.status === 'strong'
            const IconComponent = phase.icon

            return (
              <div
                key={phase.key}
                className={`rounded-xl p-4.5 border flex flex-col justify-between gap-3 shadow-sm transition-all ${
                  isFocus
                    ? 'border-l-4 border-l-[var(--accent)] bg-[var(--bg-panel)]'
                    : 'bg-[var(--bg-panel)] border-[var(--border-subtle)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="text-xs font-bold text-[var(--text)]">{phase.title}</span>
                    </div>

                    {isStrong ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#81b64c]/10 text-[#81b64c] border border-[#81b64c]/25">
                        <Check className="w-2.5 h-2.5" />
                        {phase.data.statusLabel}
                      </span>
                    ) : isFocus ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[var(--text)]/10 text-[var(--text)] border border-[var(--border)]">
                        <Target className="w-2.5 h-2.5 text-[var(--accent)]" />
                        {phase.data.statusLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {phase.data.statusLabel}
                      </span>
                    )}
                  </div>

                  {/* Accuracy Number — HERO per DESIGN.md */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-mono text-3xl font-black text-[var(--text)] tracking-tight" style={{ fontFeatureSettings: '"tnum" 1' }}>
                      {phase.data.accuracy}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">accuracy</span>
                  </div>

                  {/* Subdued progress bar */}
                  <div className="w-full h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFocus ? 'bg-[var(--text-muted)]' : 'bg-[var(--accent)]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, phase.data.accuracy))}%` }}
                    />
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {phase.data.summary}
                  </p>
                </div>

                <div
                  className={`pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] ${
                    phase.data.blunders === 0 ? 'opacity-40 text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <span>Blunders in {phase.title}:</span>
                  <span className="font-mono font-bold text-[var(--text)]">
                    {phase.data.blunders}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths Card */}
        <div
          className="rounded-xl p-5 border shadow-sm flex flex-col gap-3"
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              Tactical & Strategic Strengths
            </h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {(userStats?.strengths || [
              'Opening Foundation (88.5% avg accuracy) — builds consistent, playable setups right out of the opening.',
              'Endgame Composure (82.8% accuracy) — stays disciplined in simplified positions.',
              'Initiative with White — capitalizes on first-move tempo to dictate game flow.'
            ]).map((str, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses Card */}
        <div
          className="rounded-xl p-5 border shadow-sm flex flex-col gap-3"
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Crosshair className="w-4 h-4 text-[var(--text-muted)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              Priority Rating Leaks
            </h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {(userStats?.weaknesses || [
              'Middlegame Tactics — material lost during multi-piece exchanges between moves 13–30.',
              'Overlooking undefended minor pieces before locking in candidate moves.',
              'Defensive Repertoire with Black — finding counterplay against aggressive setups.'
            ]).map((leak, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                <Target className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                <span>{leak}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priority Training Plan & Actionable Drills */}
      <div
        className="rounded-xl p-5 border shadow-sm flex flex-col gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <Target className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
            Coach's Priority Focus
          </h3>
        </div>

        <div
          className="p-4 rounded-lg flex items-start gap-3"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Sparkles className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text)]">Immediate Action Item</span>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {nudge}
            </p>
          </div>
        </div>

        {/* Recommended Drills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {(userStats?.recommendedDrills || [
            {
              title: 'Blunder Check & Board Vision',
              category: 'Tactics',
              description: 'Perform a deliberate 3-second scan of all unprotected pieces before playing your candidate move.',
              priority: 'high' as const
            },
            {
              title: 'Middlegame Calculation & Tactics',
              category: 'Calculation',
              description: 'Practice 15 minutes of Puzzle Rush daily, emphasizing double attacks, pins, and discovered attacks.',
              priority: 'high' as const
            }
          ]).map((drill, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border flex flex-col gap-1.5 transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text)]">{drill.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  {drill.category}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {drill.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tracked 20 Games (Rolling FIFO Window) */}
      <div
        className="rounded-xl p-5 border shadow-sm flex flex-col gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
              Tracked Games (Rolling 20 · FIFO Window)
            </h3>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: '#81b64c20', color: '#81b64c', border: '1px solid #81b64c40' }}
            >
              {userStats?.recent20Games?.length || 0} of 20 Tracked
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
              First-In, First-Out Queue
            </span>
            <button
              type="button"
              onClick={() => handleSync20Games()}
              disabled={isSyncing || !userAccount.trim()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Refresh 20</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          All Coach stats and drills above are based <strong>strictly on your latest {userStats?.recent20Games?.length || 0} tracked games</strong>. As you play new games, they enter at <strong>#1 (Latest)</strong> and push out the oldest game (FIFO).
        </p>

        {/* 20 Games List */}
        {userStats?.recent20Games && userStats.recent20Games.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
            {userStats.recent20Games.map((game, idx) => {
              const isUserWhite = game.white.toLowerCase().includes((userAccount || '').toLowerCase())
              const opponent = isUserWhite ? game.black : game.white
              const oppElo = isUserWhite ? game.blackElo : game.whiteElo
              const userWon = (isUserWhite && game.result === '1-0') || (!isUserWhite && game.result === '0-1')
              const userLost = (isUserWhite && game.result === '0-1') || (!isUserWhite && game.result === '1-0')
              const outcome = userWon ? 'WIN' : userLost ? 'LOSS' : 'DRAW'
              const userAcc = isUserWhite ? game.whiteAccuracy : game.blackAccuracy
              const userBlunders = isUserWhite ? game.whiteBlunders : game.blackBlunders

              return (
                <div
                  key={game.id || idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border transition-all gap-2.5 hover:border-[var(--border)]"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold shrink-0 ${
                        idx === 0
                          ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                      }`}
                    >
                      #{idx + 1} {idx === 0 ? 'Latest' : ''}
                    </span>

                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-bold shrink-0 uppercase"
                      style={{
                        background:
                          outcome === 'WIN'
                            ? '#81b64c'
                            : outcome === 'LOSS'
                            ? '#ca3431'
                            : 'var(--text-muted)',
                        color: '#fff'
                      }}
                    >
                      {outcome}
                    </span>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] truncate">
                        <span className="text-[11px] text-[var(--text-muted)] font-normal">
                          {isUserWhite ? '♔ White' : '♚ Black'}
                        </span>
                        <span>vs {opponent}</span>
                        {oppElo && (
                          <span className="text-[11px] text-[var(--text-muted)] font-normal">
                            ({oppElo})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] truncate">
                        <span>{game.opening || game.eco || 'Game'}</span>
                        <span>·</span>
                        <span>{game.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <span className="block font-mono text-xs font-bold text-[var(--text)]">
                        {userAcc}% acc
                      </span>
                      <span className="block text-[10px] text-[var(--text-muted)]">
                        {userBlunders} {userBlunders === 1 ? 'blunder' : 'blunders'}
                      </span>
                    </div>

                    {game.pgn && onLoadPgn && (
                      <button
                        type="button"
                        onClick={() => onLoadPgn(game.pgn!)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer"
                        style={{ background: 'var(--bg-secondary)' }}
                        title="Open this game in Game Review to analyze move-by-move"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="p-6 rounded-lg text-center flex flex-col items-center gap-2 border border-dashed border-[var(--border-subtle)]"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <p className="text-xs text-[var(--text-secondary)]">
              No games tracked yet. Click <strong>"Sync Latest 20 Games"</strong> to fetch your latest 20 games from Chess.com.
            </p>
            {userAccount && (
              <button
                type="button"
                onClick={() => handleSync20Games()}
                disabled={isSyncing}
                className="mt-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer shadow-sm"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Fetch 20 Games from Chess.com
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
