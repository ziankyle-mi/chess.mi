import type { AnalyzedGameRecord } from './progressStore'
import { saveAnalyzedGamesBatch, getStoredGames } from './progressStore'
import { analyzeGameRecordFast } from '../engine/batchAnalyzer'

export interface ChesscomGameSummary {
  id: string
  url: string
  pgn: string
  white: {
    username: string
    rating: number
    result: string
  }
  black: {
    username: string
    rating: number
    result: string
  }
  timeControl: string
  endTime: number
  dateString: string
  playerColor: 'white' | 'black'
  playerResult: 'win' | 'loss' | 'draw'
  opponentUsername: string
  opponentRating: number
  accuracies?: {
    white: number
    black: number
  }
  eco?: string
}

export async function fetchChesscomGames(username: string): Promise<ChesscomGameSummary[]> {
  const cleanUser = username.trim().toLowerCase()
  if (!cleanUser) throw new Error('Please enter a Chess.com username.')

  // 1. Fetch archives list
  const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(cleanUser)}/games/archives`)
  if (!archivesRes.ok) {
    if (archivesRes.status === 404) {
      throw new Error(`Player "${username}" not found on Chess.com.`)
    }
    throw new Error(`Chess.com API error: ${archivesRes.statusText}`)
  }

  const archivesData = await archivesRes.json()
  const archives: string[] = archivesData.archives || []
  if (archives.length === 0) {
    throw new Error(`No games found in the archives for "${username}".`)
  }

  // Fetch backwards across monthly archives until we collect at least 20 games
  let rawGames: any[] = []
  for (let i = archives.length - 1; i >= 0 && rawGames.length < 20; i--) {
    try {
      const res = await fetch(archives[i])
      if (res.ok) {
        const data = await res.json()
        const monthGames: any[] = data.games || []
        // Sort month games descending by end_time
        monthGames.sort((a, b) => (b.end_time || 0) - (a.end_time || 0))
        rawGames = [...rawGames, ...monthGames]
      }
    } catch (e) {
      console.warn('Failed fetching archive month:', archives[i], e)
    }
  }

  // Sort descending by end_time (newest first)
  rawGames.sort((a, b) => (b.end_time || 0) - (a.end_time || 0))

  return rawGames
    .filter((g) => g.pgn)
    .slice(0, 20)
    .map((g, index) => {
      const isWhite = g.white.username.toLowerCase() === cleanUser
      const playerColor: 'white' | 'black' = isWhite ? 'white' : 'black'
      const player = isWhite ? g.white : g.black
      const opponent = isWhite ? g.black : g.white

      let playerResult: 'win' | 'loss' | 'draw' = 'draw'
      if (player.result === 'win') {
        playerResult = 'win'
      } else if (
        ['checkmated', 'resigned', 'timeout', 'abandoned', 'lose'].includes(player.result)
      ) {
        playerResult = 'loss'
      }

      const date = new Date((g.end_time || Date.now() / 1000) * 1000)

      return {
        id: g.uuid || `${g.end_time}-${index}`,
        url: g.url,
        pgn: g.pgn,
        white: {
          username: g.white.username,
          rating: g.white.rating || 0,
          result: g.white.result
        },
        black: {
          username: g.black.username,
          rating: g.black.rating || 0,
          result: g.black.result
        },
        timeControl: formatTimeControl(g.time_control),
        endTime: g.end_time || 0,
        dateString: date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        playerColor,
        playerResult,
        opponentUsername: opponent.username,
        opponentRating: opponent.rating || 0,
        accuracies: g.accuracies
          ? {
              white: g.accuracies.white,
              black: g.accuracies.black
            }
          : undefined,
        eco: typeof g.eco === 'string' ? g.eco : undefined
      }
    })
}

function formatTimeControl(tc?: string): string {
  if (!tc) return 'Standard'
  if (tc.includes('+')) {
    const [base, inc] = tc.split('+')
    const mins = Math.floor(parseInt(base, 10) / 60)
    return `${mins}+${inc}`
  }
  const secs = parseInt(tc, 10)
  if (!isNaN(secs)) {
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    return `${mins}m`
  }
  return tc
}

/**
 * High-speed sync that pulls the latest 20 games for a player from Chess.com archives
 * and processes them into a rolling 20 FIFO window with complete phase metrics.
 */
export async function syncChesscom20Games(
  username: string,
  onProgress?: (message: string) => void
): Promise<AnalyzedGameRecord[]> {
  const cleanUser = username.trim().toLowerCase()
  if (!cleanUser) throw new Error('Please enter a Chess.com username.')

  if (onProgress) onProgress('Connecting to Chess.com archives...')
  const summaries = await fetchChesscomGames(username)
  if (summaries.length === 0) {
    throw new Error(`No games found on Chess.com for "${username}".`)
  }

  const existingGames = getStoredGames()
  const analyzedBatch: AnalyzedGameRecord[] = []

  for (let i = 0; i < summaries.length; i++) {
    const s = summaries[i]
    if (onProgress) {
      onProgress(`Syncing game ${i + 1}/${summaries.length} (vs ${s.opponentUsername})...`)
    }

    // Check if we already have this exact game analyzed
    const already = existingGames.find(
      (g) =>
        g.id === s.id ||
        (g.white.toLowerCase() === s.white.username.toLowerCase() &&
          g.black.toLowerCase() === s.black.username.toLowerCase() &&
          g.date === s.dateString)
    )

    if (already) {
      analyzedBatch.push({ ...already, pgn: s.pgn, timeControl: s.timeControl, endTime: s.endTime })
      continue
    }

    const analyzed = analyzeGameRecordFast(s.pgn, s.accuracies, s.id)
    if (analyzed) {
      analyzed.timeControl = s.timeControl
      analyzed.endTime = s.endTime
      analyzedBatch.push(analyzed)
    }
  }

  if (onProgress) onProgress('Finalizing rolling 20 window...')
  const updated = saveAnalyzedGamesBatch(analyzedBatch)
  return updated
}
