import type { AnalyzedGameRecord } from './progressStore'
import { saveAnalyzedGamesBatch, getStoredGames } from './progressStore'
import { analyzeGameRecordFast } from '../engine/batchAnalyzer'

export type TimeControlFilter = 'all' | 'blitz' | 'rapid' | 'bullet'

export interface ChesscomGameSummary {
  id: string
  url: string
  pgn: string
  platform: 'chesscom' | 'lichess'
  timeClass: string // 'blitz' | 'rapid' | 'bullet' | 'daily' | 'classical'
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

export async function fetchChesscomGames(
  username: string,
  timeClass: TimeControlFilter = 'all'
): Promise<ChesscomGameSummary[]> {
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

  // Fetch backwards across monthly archives until we collect at least 25 matching games
  let rawGames: any[] = []
  for (let i = archives.length - 1; i >= 0 && rawGames.length < 25; i--) {
    try {
      const res = await fetch(archives[i])
      if (res.ok) {
        const data = await res.json()
        let monthGames: any[] = data.games || []
        // Sort month games descending by end_time
        monthGames.sort((a, b) => (b.end_time || 0) - (a.end_time || 0))
        if (timeClass !== 'all') {
          monthGames = monthGames.filter((g) => g.time_class?.toLowerCase() === timeClass.toLowerCase())
        }
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
        platform: 'chesscom',
        timeClass: g.time_class || 'standard',
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

export async function fetchLichessUserGames(
  username: string,
  timeClass: TimeControlFilter = 'all'
): Promise<ChesscomGameSummary[]> {
  const cleanUser = username.trim()
  if (!cleanUser) throw new Error('Please enter a Lichess username.')

  const perfQuery = timeClass === 'all' ? 'blitz,rapid,classical,bullet' : timeClass
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(cleanUser)}?max=20&pgnInJson=true&opening=true&perfType=${perfQuery}`

  const res = await fetch(url, {
    headers: { Accept: 'application/x-ndjson' }
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error(`Player "${username}" not found on Lichess.`)
    throw new Error(`Lichess API error: ${res.statusText}`)
  }

  const text = await res.text()
  const lines = text.trim().split('\n').filter(Boolean)
  const rawGames = lines.map((l) => JSON.parse(l))

  return rawGames
    .filter((g) => g.pgn)
    .map((g, index) => {
      const isWhite = g.players?.white?.user?.name?.toLowerCase() === cleanUser.toLowerCase()
      const playerColor: 'white' | 'black' = isWhite ? 'white' : 'black'
      const opponent = isWhite ? g.players?.black : g.players?.white

      let playerResult: 'win' | 'loss' | 'draw' = 'draw'
      if (g.winner) {
        playerResult = (isWhite && g.winner === 'white') || (!isWhite && g.winner === 'black') ? 'win' : 'loss'
      }

      const date = new Date(g.createdAt || Date.now())

      return {
        id: g.id || `lichess-${index}`,
        url: `https://lichess.org/${g.id}`,
        pgn: g.pgn,
        platform: 'lichess',
        timeClass: g.speed || g.perf || 'standard',
        white: {
          username: g.players?.white?.user?.name || 'Anonymous',
          rating: g.players?.white?.rating || 0,
          result: g.winner === 'white' ? 'win' : 'loss'
        },
        black: {
          username: g.players?.black?.user?.name || 'Anonymous',
          rating: g.players?.black?.rating || 0,
          result: g.winner === 'black' ? 'win' : 'loss'
        },
        timeControl: g.speed ? g.speed.toUpperCase() : 'Standard',
        endTime: Math.floor(g.lastMoveAt ? g.lastMoveAt / 1000 : Date.now() / 1000),
        dateString: date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        playerColor,
        playerResult,
        opponentUsername: opponent?.user?.name || 'Anonymous',
        opponentRating: opponent?.rating || 0,
        eco: g.opening?.name
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

export async function syncRecentGamesFast(
  username: string,
  onProgress?: (analyzed: number, total: number) => void
): Promise<AnalyzedGameRecord[]> {
  const summaries = await fetchChesscomGames(username)
  if (summaries.length === 0) return []

  const existing = getStoredGames()
  const existingIds = new Set(existing.map((g) => g.id))
  const newSummaries = summaries.filter((s) => !existingIds.has(s.id))

  if (newSummaries.length === 0) return []

  const total = Math.min(newSummaries.length, 10)
  const toAnalyze = newSummaries.slice(0, total)
  const results: AnalyzedGameRecord[] = []

  for (let i = 0; i < toAnalyze.length; i++) {
    const sum = toAnalyze[i]
    try {
      const record = analyzeGameRecordFast(sum.pgn, sum.accuracies, sum.id)
      if (record) {
        results.push(record)
      }
      onProgress?.(i + 1, total)
    } catch (e) {
      console.warn('Fast analysis failed for game:', sum.id, e)
    }
  }

  if (results.length > 0) {
    saveAnalyzedGamesBatch(results)
  }

  return results
}
