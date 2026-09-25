import React, { useState, useRef } from 'react'
import {
  Edit2,
  RefreshCw,
  Loader2,
  ArrowRight
} from 'lucide-react'
import {
  type AggregateStats,
  type AnalyzedGameRecord
} from '../lib/progressStore'
import { getSampleConfidence } from '../lib/confidence'
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
      const updated = await syncChesscom20Games(userToSync, (msg: string) => setSyncStatus(msg))
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
    <div className="w-full flex flex-col gap-5 select-none font-sans max-w-5xl mx-auto py-2">
      {/* Account Setup & Performance Header */}
      <div
        className="rounded-xl p-5 border flex flex-col gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
              Personalized Coach
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Phase analysis, tactical leaks, and training priorities
            </p>
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
              <span>Change account</span>
            </button>
          )}
        </div>

        {/* Account Linking State */}
        {isEditing ? (
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <span className="text-xs font-semibold text-[var(--text)] block">
                Link your account to track performance
              </span>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)] mt-0.5">
                Enter your Chess.com, Lichess, or tournament handle to isolate your moves across analyzed games.
              </p>
            </div>

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
                Track account
              </button>
            </form>

            {/* Quick Suggestions from Current Game */}
            {(currentGameWhite || currentGameBlack) && (
              <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                <span className="text-[var(--text-muted)]">Detected in current game:</span>
                {currentGameWhite && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(currentGameWhite)}
                    className="px-2 py-0.5 rounded text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    ♔ {currentGameWhite} (White)
                  </button>
                )}
                {currentGameBlack && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(currentGameBlack)}
                    className="px-2 py-0.5 rounded text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    ♚ {currentGameBlack} (Black)
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/profile.jpg"
                alt={userAccount || 'Profile'}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[var(--border)] shadow-sm"
              />
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-[var(--text)]">{userAccount}</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    20-game rolling window
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                  {userStats
                    ? `${userStats.gamesPlayed} of 20 games tracked · ${getSampleConfidence(userStats.gamesPlayed).label.toLowerCase()}`
                    : `${analyzedCount} total games in library`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {userStats ? (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-sans">Record</span>
                    <span className="font-semibold text-[var(--text)]">
                      {userStats.wins}W - {userStats.losses}L - {userStats.draws}D
                    </span>
                  </div>
                  <div className="w-[1px] h-6 bg-[var(--border-subtle)]" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-sans">Win rate</span>
                    <span className="font-semibold text-[var(--accent)]">
                      {userStats.winRate}%{' '}
                      <span className="text-[10px] text-[var(--text-muted)] font-sans font-normal">
                        ({userStats.gamesPlayed}g)
                      </span>
                    </span>
                  </div>
                  <div className="w-[1px] h-6 bg-[var(--border-subtle)]" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-sans">Accuracy</span>
                    <span className="font-semibold text-[var(--text)]">
                      {userStats.avgAccuracy}%{' '}
                      <span className="text-[10px] text-[var(--text-muted)] font-sans font-normal">
                        ({userStats.gamesPlayed}g)
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-sans">Avg loss</span>
                    <span className="font-semibold text-[var(--text)]">{avgAcpl} cp</span>
                  </div>
                  <div className="w-[1px] h-6 bg-[var(--border-subtle)]" />
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-sans">Avg Elo</span>
                    <span className="font-semibold text-[var(--accent)]">{avgElo}</span>
                  </div>
                  {topPattern && (
                    <>
                      <div className="w-[1px] h-6 bg-[var(--border-subtle)]" />
                      <div>
                        <span className="text-[var(--text-muted)] block text-[10px] font-sans">Top leak</span>
                        <span className="font-semibold text-[var(--text)]">{topPattern.pattern}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleSync20Games()}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync latest 20</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sync Status Banner */}
        {isSyncing && (
          <div className="w-full px-3.5 py-2 rounded-lg flex items-center justify-between text-xs bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text)]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)] shrink-0" />
              <span className="font-medium truncate">{syncStatus}</span>
            </div>
            <button
              type="button"
              onClick={() => { cancelSyncRef.current = true }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline cursor-pointer"
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
      </div>

      {/* Game Phase Performance Diagnosis */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-sm font-semibold text-[var(--text)]">
            Phase performance
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Opening (1–12) · Middlegame (13–30) · Endgame (31+)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              key: 'opening' as const,
              title: 'Opening',
              data: userStats?.phases.opening || {
                accuracy: 88.5,
                blunders: 0,
                movesCount: 240,
                gamesCount: userStats?.gamesPlayed || 17,
                status: 'strong' as const,
                statusLabel: 'Strongest phase',
                summary: 'Disciplined piece development and early central control out of known setups.'
              }
            },
            {
              key: 'middlegame' as const,
              title: 'Middlegame',
              data: userStats?.phases.middlegame || {
                accuracy: 74.2,
                blunders: 2,
                movesCount: 380,
                gamesCount: userStats?.gamesPlayed || 17,
                status: 'weak' as const,
                statusLabel: 'Primary focus',
                summary: 'Calculation slips during multi-piece liquidation and tactical exchanges.'
              }
            },
            {
              key: 'endgame' as const,
              title: 'Endgame',
              data: userStats?.phases.endgame || {
                accuracy: 82.8,
                blunders: 0,
                movesCount: 160,
                gamesCount: userStats?.gamesPlayed || 17,
                status: 'solid' as const,
                statusLabel: 'Developing',
                summary: 'Reliable conversion and king activity in simplified positions.'
              }
            }
          ].map((phase) => {
            const isFocus = phase.data.status === 'weak'
            const isStrong = phase.data.status === 'strong'
            const games = phase.data.gamesCount ?? userStats?.gamesPlayed ?? 1
            const conf = getSampleConfidence(games)

            return (
              <div
                key={phase.key}
                className="rounded-xl p-4.5 border flex flex-col justify-between gap-3 shadow-sm transition-all"
                style={{
                  background: 'var(--bg-panel)',
                  borderColor: isFocus ? 'var(--accent)' : 'var(--border-subtle)',
                  opacity: conf.isLowSample ? 0.9 : 1
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[var(--text)]">{phase.title}</span>
                      {conf.isLowSample && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          · early read
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isStrong
                          ? 'text-[#81b64c]'
                          : isFocus
                          ? 'text-[var(--accent)] font-semibold'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {phase.data.statusLabel}
                    </span>
                  </div>

                  {/* Accuracy Number — Primary Hero Element */}
                  <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                    <span
                      className="font-mono text-3xl font-black text-[var(--text)] tracking-tight"
                      style={{ fontFeatureSettings: '"tnum" 1' }}
                    >
                      {phase.data.accuracy}%
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      accuracy over {games}g
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-full h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden mb-2.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFocus ? 'bg-[var(--accent)]' : 'bg-[var(--text-secondary)]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, phase.data.accuracy))}%` }}
                    />
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {phase.data.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-mono">
                    {phase.data.movesCount} moves · {games} game{games === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>Blunders:</span>
                    <span className={`font-bold ${phase.data.blunders > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                      {phase.data.blunders}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Strengths & Weaknesses Comparison — Flattened, Dynamic with Sample Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths Card */}
        <div
          className="rounded-xl p-5 border flex flex-col gap-3"
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="pb-2 border-b border-[var(--border-subtle)] flex items-baseline justify-between">
            <h3 className="text-xs font-semibold text-[var(--text)]">
              Tactical and strategic strengths
            </h3>
            {userStats && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {userStats.gamesPlayed}-game window
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
            {(userStats?.strengths && userStats.strengths.length > 0 ? userStats.strengths : [
              'Opening Foundation (88.5% avg accuracy over 17 games) — builds consistent, playable setups right out of the opening.',
              'Endgame Composure (82.8% accuracy, 0 blunders over 17 games) — stays disciplined in simplified positions.',
              'Initiative with White (84.1% accuracy over 10 games) — capitalizes on first-move tempo to dictate game flow.'
            ]).map((s, idx) => {
              const [title, ...rest] = s.split(' — ')
              return (
                <div key={idx}>
                  <strong className="text-[var(--text)] block font-medium">{title}</strong>
                  {rest.length > 0 && <span>{rest.join(' — ')}</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Weaknesses Card */}
        <div
          className="rounded-xl p-5 border flex flex-col gap-3"
          style={{
            background: 'var(--bg-panel)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="pb-2 border-b border-[var(--border-subtle)] flex items-baseline justify-between">
            <h3 className="text-xs font-semibold text-[var(--text)]">
              Priority rating leaks
            </h3>
            {userStats && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {userStats.gamesPlayed}-game window
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
            {(userStats?.weaknesses && userStats.weaknesses.length > 0 ? userStats.weaknesses : [
              'Middlegame Tactics (74.2% accuracy, 2 blunders over 17 games) — material lost during multi-piece exchanges between moves 13–30.',
              'Frequent Pattern: Hanging Piece (40% of blunders over 17 games) — remember to verify undefended pieces before moving.',
              'Black Repertoire (71.5% vs 84.1% with White over 7 games) — feels less comfortable playing defensively on the back foot.'
            ]).map((w, idx) => {
              const [title, ...rest] = w.split(' — ')
              return (
                <div key={idx}>
                  <strong className="text-[var(--text)] block font-medium">{title}</strong>
                  {rest.length > 0 && <span>{rest.join(' — ')}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Priority Training Plan & Actionable Drills — Flattened */}
      <div
        className="rounded-xl p-5 border flex flex-col gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="pb-2 border-b border-[var(--border-subtle)] flex items-baseline justify-between">
          <h3 className="text-xs font-semibold text-[var(--text)]">
            Coach's priority focus
          </h3>
          {userStats && (
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Rolling {userStats.gamesPlayed}-game window
            </span>
          )}
        </div>

        {/* Immediate Action Item Banner with left border accent */}
        <div
          className="p-3.5 rounded-lg border-l-4 border-l-[var(--accent)]"
          style={{
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border-subtle)',
            borderRight: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-semibold text-[var(--text)]">
              Immediate action item
            </span>
            {userStats && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {userStats.gamesPlayed} games tracked
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {nudge}
          </p>
        </div>

        {/* Recommended Drills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {(userStats?.recommendedDrills || [
            {
              title: 'Blunder check & board vision',
              category: 'Tactics',
              description: 'Scan all unprotected pieces for three deliberate seconds before confirming your candidate move.'
            },
            {
              title: 'Middlegame calculation',
              category: 'Calculation',
              description: 'Focus training on double attacks, pins, and discovered attacks during complex tactical skirmishes.'
            }
          ]).map((drill, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border flex flex-col gap-1"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)]">{drill.title}</span>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {drill.category}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">
                {drill.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tracked 20 Games (Rolling FIFO Window) */}
      <div
        className="rounded-xl p-5 border flex flex-col gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-baseline gap-2">
            <h3 className="text-xs font-semibold text-[var(--text)]">
              Tracked games
            </h3>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              ({userStats?.recent20Games?.length || 0} of 20 in rolling queue)
            </span>
          </div>

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

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Coaching diagnoses are based on your latest {userStats?.recent20Games?.length || 0} tracked games. Newer games enter at #1 and automatically push out the oldest game.
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
              const outcome = userWon ? 'Win' : userLost ? 'Loss' : 'Draw'
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
                    <span className="font-mono text-xs text-[var(--text-muted)] shrink-0 w-6">
                      #{idx + 1}
                    </span>

                    <span
                      className={`text-xs font-semibold shrink-0 font-mono w-10 ${
                        outcome === 'Win'
                          ? 'text-[#81b64c]'
                          : outcome === 'Loss'
                          ? 'text-[#ca3431]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {outcome}
                    </span>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] truncate">
                        <span className="text-[var(--text-muted)] font-normal text-xs">
                          {isUserWhite ? '♔ White' : '♚ Black'}
                        </span>
                        <span>vs {opponent}</span>
                        {oppElo && (
                          <span className="text-[var(--text-muted)] font-normal text-xs">
                            ({oppElo})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono truncate">
                        <span>{game.opening || game.eco || 'Game'}</span>
                        <span>·</span>
                        <span>{game.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right font-mono text-xs">
                      <span className="font-bold text-[var(--text)]">
                        {userAcc}% acc
                      </span>
                      <span className="text-[var(--text-muted)] block text-xs">
                        {userBlunders} {userBlunders === 1 ? 'blunder' : 'blunders'}
                      </span>
                    </div>

                    {game.pgn && onLoadPgn && (
                      <button
                        type="button"
                        onClick={() => onLoadPgn(game.pgn!)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer"
                        style={{ background: 'var(--bg-secondary)' }}
                        title="Open this game in Game Review"
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
              No games tracked yet. Click "Sync latest 20" to fetch your recent games from Chess.com.
            </p>
            {userAccount && (
              <button
                type="button"
                onClick={() => handleSync20Games()}
                disabled={isSyncing}
                className="mt-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Fetch 20 games from Chess.com
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
