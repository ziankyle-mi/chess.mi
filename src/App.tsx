import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Chess, type Square } from 'chess.js'
import { parsePgn, SAMPLE_GAMES, type ParsedGame, type ParsedMove } from './lib/pgnParser'
import { stockfishEngine } from './engine/stockfishWorker'
import { classifySingleMove, identifyOpening, isBookPosition, aggregateGameAccuracy } from './engine/classifyMove'
import {
  getStoredGames,
  saveAnalyzedGame,
  clearStoredGames,
  calculateAggregateStats,
  getUserAccount,
  setUserAccount,
  type AnalyzedGameRecord,
  type AggregateStats
} from './lib/progressStore'
import { ThemeProvider } from './lib/ThemeContext'
import { Board } from './components/Board'
import { EvalBar } from './components/EvalBar'
import { MoveList, type ClassFilter } from './components/MoveList'
import { MoveExplanation } from './components/MoveExplanation'
import { GameImport } from './components/GameImport'
import { StatsDashboard } from './components/StatsDashboard'
import { StudyNext } from './components/StudyNext'
import { ThemePicker } from './components/ThemePicker'
import { PlayerCard } from './components/PlayerCard'
import { GameReviewReport } from './components/GameReviewReport'
import { computeMaterialAndCaptures } from './lib/chessUtils'
import { playMoveAudio } from './lib/sounds'
import { BarChart2, Compass, Download, CheckCircle2, Cpu, Swords, Volume2, VolumeX, Undo2, Award } from 'lucide-react'

function AppInner() {
  const [game, setGame] = useState<ParsedGame>(() => parsePgn(SAMPLE_GAMES[0].pgn))
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0)
  const [isFlipped, setIsFlipped] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'board' | 'stats' | 'study' | 'import'>('board')
  const [sideView, setSideView] = useState<'review' | 'analysis'>('review')
  const [moveListFilter, setMoveListFilter] = useState<ClassFilter>('all')
  const [filterCritical, setFilterCritical] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analyzedPlies, setAnalyzedPlies] = useState<number>(0)
  const analysisCancelRef = useRef<boolean>(false)
  const isUserImportRef = useRef<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('chess_analyzer_sound') !== 'off' } catch { return true }
  })
  const prevMoveIndexRef = useRef<number>(-1)
  const [storedGames, setStoredGames] = useState<AnalyzedGameRecord[]>([])
  const [userAccount, setUserAccountState] = useState<string>(() => getUserAccount())
  const [aggregateStats, setAggregateStats] = useState<AggregateStats>(() => calculateAggregateStats([], getUserAccount()))
  const [playSpeed, setPlaySpeed] = useState<number>(1200)
  const [explorationState, setExplorationState] = useState<{
    active: boolean
    fromFen: string
    testFen: string
    testMoveSan: string
    testMoveParsed?: ParsedMove
  } | null>(null)

  useEffect(() => {
    const list = getStoredGames()
    setStoredGames(list)
    setAggregateStats(calculateAggregateStats(list, userAccount))
  }, [userAccount])

  const handleUpdateUserAccount = useCallback((name: string) => {
    setUserAccount(name)
    setUserAccountState(name)
    setAggregateStats(calculateAggregateStats(storedGames, name))
  }, [storedGames])

  useEffect(() => {
    if (game.moves.length > 0 && !game.openingName) {
      const detected = identifyOpening(game.moves)
      setGame((prev) => ({
        ...prev,
        openingName: prev.metadata.opening || detected.name,
        ecoCode: prev.metadata.eco || detected.eco
      }))
    }
  }, [game.moves, game.openingName])

  const runGameAnalysis = useCallback(async (parsedGame: ParsedGame) => {
    if (parsedGame.moves.length === 0) return
    analysisCancelRef.current = false
    setIsAnalyzing(true)
    setAnalyzedPlies(0)

    const updatedMoves = [...parsedGame.moves]
    let prevEval = 20
    let prevBestMoveLan: string | undefined = undefined

    try {
      const initialRes = await stockfishEngine.evaluateFen(parsedGame.initialFen, 12)
      prevEval = initialRes.eval
      prevBestMoveLan = initialRes.bestMoveLan
    } catch { prevEval = 20 }

    const blunderPatterns: Record<string, number> = {}
    let whiteBlunders = 0, blackBlunders = 0, whiteMistakes = 0, blackMistakes = 0
    let whiteInaccuracies = 0, blackInaccuracies = 0, whiteLossSum = 0, blackLossSum = 0

    const whiteBlunderPatterns: Record<string, number> = {}
    const blackBlunderPatterns: Record<string, number> = {}

    for (let i = 0; i < updatedMoves.length; i++) {
      if (analysisCancelRef.current) break
      const move = updatedMoves[i]
      const isBook = isBookPosition(move.fenAfter)
      const evalRes = await stockfishEngine.evaluateFen(move.fenAfter, 12)
      const currentEval = evalRes.eval

      // Pass prevBestMoveLan because that was the best move in the position before move[i] was played!
      const classification = classifySingleMove(move, prevEval, currentEval, prevBestMoveLan, isBook)
      move.eval = currentEval
      move.mate = evalRes.mate
      move.bestMoveLan = evalRes.bestMoveLan
      move.bestMoveSan = classification.bestMoveSan
      move.classification = classification.classification
      move.moveAccuracy = classification.moveAccuracy
      move.winLoss = classification.winLoss
      move.explanation = classification.explanation
      move.tacticalPattern = classification.tacticalPattern
      move.isCritical = classification.isCritical

      if (move.color === 'w') {
        whiteLossSum += classification.evalLoss
        if (move.classification === 'blunder') {
          whiteBlunders++
          if (move.tacticalPattern) {
            whiteBlunderPatterns[move.tacticalPattern] = (whiteBlunderPatterns[move.tacticalPattern] || 0) + 1
          }
        }
        if (move.classification === 'mistake') whiteMistakes++
        if (move.classification === 'inaccuracy') whiteInaccuracies++
      } else {
        blackLossSum += classification.evalLoss
        if (move.classification === 'blunder') {
          blackBlunders++
          if (move.tacticalPattern) {
            blackBlunderPatterns[move.tacticalPattern] = (blackBlunderPatterns[move.tacticalPattern] || 0) + 1
          }
        }
        if (move.classification === 'mistake') blackMistakes++
        if (move.classification === 'inaccuracy') blackInaccuracies++
      }
      if (move.classification === 'blunder' && move.tacticalPattern) {
        blunderPatterns[move.tacticalPattern] = (blunderPatterns[move.tacticalPattern] || 0) + 1
      }
      prevEval = currentEval
      prevBestMoveLan = evalRes.bestMoveLan
      setAnalyzedPlies(i + 1)
      if (i % 2 === 0 || i === updatedMoves.length - 1) {
        setGame((prev) => ({ ...prev, moves: [...updatedMoves] }))
      }
    }
    setIsAnalyzing(false)

    const whiteMovesList = updatedMoves.filter((m) => m.color === 'w')
    const blackMovesList = updatedMoves.filter((m) => m.color === 'b')
    const whiteCount = whiteMovesList.length || 1
    const blackCount = blackMovesList.length || 1
    const whiteAcpl = Math.round(whiteLossSum / whiteCount)
    const blackAcpl = Math.round(blackLossSum / blackCount)

    // Accurate game accuracy: harmonic-weighted aggregate of move accuracies
    const whiteAccuracies = whiteMovesList.map((m) => m.moveAccuracy ?? 75)
    const blackAccuracies = blackMovesList.map((m) => m.moveAccuracy ?? 75)
    const whiteAccuracy = whiteMovesList.length > 0 ? aggregateGameAccuracy(whiteAccuracies) : 75
    const blackAccuracy = blackMovesList.length > 0 ? aggregateGameAccuracy(blackAccuracies) : 75

    const computePhaseData = (mList: typeof updatedMoves) => {
      const op = mList.filter((m) => m.moveNumber <= 12)
      const mid = mList.filter((m) => m.moveNumber > 12 && m.moveNumber <= 30)
      const end = mList.filter((m) => m.moveNumber > 30)

      const calcAcc = (arr: typeof updatedMoves) => {
        if (arr.length === 0) return 0
        const accuracies = arr.map((m) => m.moveAccuracy ?? 75)
        return aggregateGameAccuracy(accuracies)
      }

      return {
        openingAcc: calcAcc(op),
        middlegameAcc: calcAcc(mid),
        endgameAcc: calcAcc(end),
        openingBlunders: op.filter((m) => m.classification === 'blunder').length,
        middlegameBlunders: mid.filter((m) => m.classification === 'blunder').length,
        endgameBlunders: end.filter((m) => m.classification === 'blunder').length,
        openingCount: op.length,
        middlegameCount: mid.length,
        endgameCount: end.length
      }
    }

    const whitePhases = computePhaseData(whiteMovesList)
    const blackPhases = computePhaseData(blackMovesList)

    const record: AnalyzedGameRecord = {
      id: `${parsedGame.metadata.white}-${parsedGame.metadata.black}-${Date.now()}`,
      date: parsedGame.metadata.date || new Date().toISOString().slice(0, 10),
      white: parsedGame.metadata.white, black: parsedGame.metadata.black,
      whiteElo: parsedGame.metadata.whiteElo ? parseInt(parsedGame.metadata.whiteElo, 10) : undefined,
      blackElo: parsedGame.metadata.blackElo ? parseInt(parsedGame.metadata.blackElo, 10) : undefined,
      result: parsedGame.metadata.result, eco: parsedGame.ecoCode || 'A00',
      opening: parsedGame.openingName || 'Opening',
      whiteAccuracy, blackAccuracy,
      whiteAcpl, blackAcpl, whiteBlunders, blackBlunders, whiteMistakes, blackMistakes,
      whiteInaccuracies, blackInaccuracies,
      blunderPatterns,
      whiteBlunderPatterns,
      blackBlunderPatterns,
      whitePhases,
      blackPhases
    }
    saveAnalyzedGame(record)
    const updatedList = getStoredGames()
    setStoredGames(updatedList)
    setAggregateStats(calculateAggregateStats(updatedList, userAccount))
    if (isUserImportRef.current) {
      isUserImportRef.current = false
      setActiveTab('board')
      setSideView('review')
    }
  }, [])

  const handleLoadPgn = useCallback((pgn: string) => {
    stockfishEngine.stop()
    analysisCancelRef.current = true
    setExplorationState(null)
    isUserImportRef.current = true
    try {
      const parsed = parsePgn(pgn)
      const detected = identifyOpening(parsed.moves)
      parsed.openingName = parsed.metadata.opening || detected.name
      parsed.ecoCode = parsed.metadata.eco || detected.eco
      setGame(parsed)
      setCurrentMoveIndex(-1)
      setActiveTab('board')
      setSideView('review')
      setMoveListFilter('all')
      runGameAnalysis(parsed)
    } catch { alert('Invalid PGN format.') }
  }, [runGameAnalysis])

  useEffect(() => {
    if (game.moves.length > 0 && game.moves[0].eval === undefined && !isAnalyzing) {
      runGameAnalysis(game)
    }
  }, [game, isAnalyzing, runGameAnalysis])

  const handlePrev = useCallback(() => {
    setExplorationState(null)
    setCurrentMoveIndex((p) => Math.max(-1, p - 1))
  }, [])
  const handleNext = useCallback(() => {
    setExplorationState(null)
    setCurrentMoveIndex((p) => Math.min(game.moves.length - 1, p + 1))
  }, [game.moves.length])
  const handleFirst = useCallback(() => {
    setExplorationState(null)
    setCurrentMoveIndex(-1)
  }, [])
  const handleLast = useCallback(() => {
    setExplorationState(null)
    setCurrentMoveIndex(game.moves.length - 1)
  }, [game.moves.length])
  const handleFlip = useCallback(() => setIsFlipped((p) => !p), [])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        if (prev >= game.moves.length - 1) { setIsPlaying(false); return prev }
        return prev + 1
      })
    }, playSpeed)
    return () => clearInterval(interval)
  }, [isPlaying, game.moves.length, playSpeed])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleNext() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); handleFirst() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); handleLast() }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); handleFlip() }
      else if (e.key === ' ') { e.preventDefault(); setIsPlaying((p) => !p) }
      else if (e.key === 'Escape') { setExplorationState(null) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, handleFirst, handleLast, handleFlip])

  const currentMove = currentMoveIndex >= 0 ? game.moves[currentMoveIndex] : undefined
  const currentFen = currentMove ? currentMove.fenAfter : game.initialFen
  const activeFen = explorationState ? explorationState.testFen : currentFen
  const currentLastMove = explorationState ? undefined : (currentMove ? { from: currentMove.from, to: currentMove.to } : undefined)

  const material = useMemo(() => computeMaterialAndCaptures(activeFen), [activeFen])

  const inCheck = useMemo(() => {
    try {
      const chess = new Chess(activeFen)
      return chess.inCheck()
    } catch {
      return false
    }
  }, [activeFen])

  const handleMakeMove = useCallback((source: string, target: string) => {
    try {
      const baseFen = explorationState ? explorationState.testFen : currentFen
      const chess = new Chess(baseFen)
      const move = chess.move({ from: source, to: target, promotion: 'q' })
      if (move) {
        if (soundEnabled) playMoveAudio(move.san, move.captured)
        const ply = (currentMove?.ply ?? 0) + 1
        const parsedMove: ParsedMove = {
          index: (currentMove?.index ?? 0) + 1,
          ply,
          moveNumber: Math.floor(ply / 2) + 1,
          color: move.color,
          san: move.san,
          lan: move.lan || `${move.from}${move.to}`,
          from: move.from as Square,
          to: move.to as Square,
          piece: move.piece,
          captured: move.captured,
          promotion: move.promotion,
          fenBefore: baseFen,
          fenAfter: chess.fen(),
          eval: currentMove?.eval,
          classification: 'good'
        }
        setExplorationState({
          active: true,
          fromFen: currentFen,
          testFen: chess.fen(),
          testMoveSan: move.san,
          testMoveParsed: parsedMove
        })
        return true
      }
    } catch {
      return false
    }
    return false
  }, [currentFen, currentMove, explorationState, soundEnabled])

  // Play sound effect on move change
  useEffect(() => {
    if (!soundEnabled) return
    if (currentMoveIndex === prevMoveIndexRef.current) return
    prevMoveIndexRef.current = currentMoveIndex
    if (currentMove) {
      playMoveAudio(currentMove.san, currentMove.captured)
    }
  }, [currentMoveIndex, currentMove, soundEnabled])

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem('chess_analyzer_sound', next ? 'on' : 'off')
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    if (confirm('Clear all stored analysis history?')) {
      clearStoredGames()
      setStoredGames([])
      setAggregateStats(calculateAggregateStats([]))
    }
  }, [])

  const tabs = [
    { id: 'review' as const, label: 'Review', icon: Award },
    { id: 'board' as const, label: 'Analysis', icon: Swords },
    { id: 'stats' as const, label: 'Stats', icon: BarChart2 },
    { id: 'study' as const, label: 'Coach', icon: Compass },
    { id: 'import' as const, label: 'Import', icon: Download }
  ]

  const handleNavClick = (id: 'review' | 'board' | 'stats' | 'study' | 'import') => {
    if (id === 'review') {
      setActiveTab('board')
      setSideView('review')
    } else if (id === 'board') {
      setActiveTab('board')
      setSideView('analysis')
    } else {
      setActiveTab(id)
    }
  }

  const isNavActive = (id: string) => {
    if (activeTab === 'board') {
      if (id === 'review') return sideView === 'review'
      if (id === 'board') return sideView === 'analysis'
      return false
    }
    return activeTab === id
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-2.5" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              ♞
            </div>
            <span className="font-semibold text-sm hidden sm:block tracking-tight" style={{ color: 'var(--text)' }}>
              chess.mi
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-0.5">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all"
                style={{
                  background: isNavActive(id) ? 'var(--bg-elevated)' : 'transparent',
                  color: isNavActive(id) ? 'var(--text)' : 'var(--text-muted)'
                }}
                onMouseEnter={(e) => { if (!isNavActive(id)) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { if (!isNavActive(id)) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Engine status */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {isAnalyzing ? (
              <>
                <Cpu className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--accent)' }} />
                <span>{analyzedPlies}/{game.moves.length}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span>Ready</span>
              </>
            )}
          </div>
          <ThemePicker />
        </div>
      </header>

      {/* Subheader — opening info and view toggle */}
      {activeTab === 'board' && (
        <div className="px-4 lg:px-6 py-1.5 flex items-center justify-between text-xs overflow-x-auto gap-2" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{game.openingName || 'Game'}</span>
            {game.ecoCode && (
              <span className="font-mono px-1.5 py-0.5 rounded text-[10px] shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {game.ecoCode}
              </span>
            )}
            <span>·</span>
            <span className="whitespace-nowrap truncate">
              {game.metadata.white} {game.metadata.whiteElo ? `(${game.metadata.whiteElo})` : ''} vs {game.metadata.black} {game.metadata.blackElo ? `(${game.metadata.blackElo})` : ''}
            </span>
            <span className="font-mono shrink-0">[{game.metadata.result}]</span>
          </div>

          <div className="flex items-center p-0.5 rounded-md shrink-0 select-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setSideView('review')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer"
              style={{
                background: sideView === 'review' ? 'var(--bg-panel)' : 'transparent',
                color: sideView === 'review' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: sideView === 'review' ? '0 1px 2px rgba(0,0,0,0.15)' : 'none'
              }}
              title="Game Review (Accuracy, Ratings, Breakdown)"
            >
              <Award className="w-3.5 h-3.5" style={{ color: sideView === 'review' ? 'var(--accent)' : 'inherit' }} />
              <span>Review</span>
            </button>
            <button
              onClick={() => setSideView('analysis')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer"
              style={{
                background: sideView === 'analysis' ? 'var(--bg-panel)' : 'transparent',
                color: sideView === 'analysis' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: sideView === 'analysis' ? '0 1px 2px rgba(0,0,0,0.15)' : 'none'
              }}
              title="Move Analysis (Move list, Coach feedback)"
            >
              <Swords className="w-3.5 h-3.5" style={{ color: sideView === 'analysis' ? 'var(--accent)' : 'inherit' }} />
              <span>Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-8 py-2 flex flex-col justify-center items-center">
        {activeTab === 'import' && (
          <div className="max-w-3xl mx-auto w-full my-auto">
            <GameImport onLoadPgn={handleLoadPgn} currentLoading={isAnalyzing} />
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="max-w-4xl mx-auto w-full my-auto">
            <StatsDashboard
              currentMoves={game.moves} whitePlayer={game.metadata.white} blackPlayer={game.metadata.black}
              aggregateStats={aggregateStats} recentGames={storedGames} onClearHistory={clearHistory}
            />
          </div>
        )}
        {activeTab === 'study' && (
          <div className="max-w-4xl mx-auto w-full my-auto">
            <StudyNext
              nudge={aggregateStats.studyNextNudge}
              topPattern={aggregateStats.topBlunderPattern}
              avgAcpl={aggregateStats.avgAcplLast20}
              avgElo={aggregateStats.avgElo}
              analyzedCount={storedGames.length}
              userAccount={userAccount}
              onUpdateUserAccount={handleUpdateUserAccount}
              aggregateStats={aggregateStats}
              currentGameWhite={game.metadata.white}
              currentGameBlack={game.metadata.black}
              onBatchSync={(records) => {
                setStoredGames(records)
                setAggregateStats(calculateAggregateStats(records, userAccount))
              }}
              onLoadPgn={handleLoadPgn}
            />
          </div>
        )}
        {activeTab === 'board' && (
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8 w-full max-w-[1240px] my-auto">
            <div className="flex flex-col items-center lg:items-start gap-1.5 w-full max-w-[560px] shrink-0">
              {/* Top player */}
              <PlayerCard
                name={isFlipped ? game.metadata.white : game.metadata.black}
                elo={isFlipped ? game.metadata.whiteElo : game.metadata.blackElo}
                side={isFlipped ? 'White' : 'Black'}
                captured={isFlipped ? material.whiteCaptured : material.blackCaptured}
                materialAdvantage={isFlipped ? Math.max(0, material.materialDiff) : Math.max(0, -material.materialDiff)}
                isTurn={material.turn === (isFlipped ? 'w' : 'b')}
                inCheck={inCheck && material.turn === (isFlipped ? 'w' : 'b')}
              />

              {/* Exploration status banner */}
              {explorationState && (
                <div
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--accent)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>Alternate Line:</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>{explorationState.testMoveSan}</span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>(Testing variation)</span>
                  </div>
                  <button
                    onClick={() => setExplorationState(null)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border-subtle)' }}
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Return to Game (Esc)</span>
                  </button>
                </div>
              )}

              <div className="flex gap-2 w-full justify-center items-stretch">
                <EvalBar evaluation={currentMove?.eval ?? 20} mate={currentMove?.mate} isFlipped={isFlipped} />
                <div className="flex-1 max-w-[530px]">
                  <Board
                    fen={activeFen}
                    orientation={isFlipped ? 'black' : 'white'}
                    lastMove={currentLastMove}
                    bestMoveLan={explorationState ? undefined : currentMove?.bestMoveLan}
                    showBestMoveArrow={!explorationState}
                    classification={explorationState ? undefined : currentMove?.classification}
                    kingInCheckSquare={inCheck ? material.kingSquare : undefined}
                    onMakeMove={handleMakeMove}
                    allowDragging={true}
                  />
                </div>
              </div>

              {/* Bottom player */}
              <PlayerCard
                name={isFlipped ? game.metadata.black : game.metadata.white}
                elo={isFlipped ? game.metadata.blackElo : game.metadata.whiteElo}
                side={isFlipped ? 'Black' : 'White'}
                captured={isFlipped ? material.blackCaptured : material.whiteCaptured}
                materialAdvantage={isFlipped ? Math.max(0, -material.materialDiff) : Math.max(0, material.materialDiff)}
                isTurn={material.turn === (isFlipped ? 'b' : 'w')}
                inCheck={inCheck && material.turn === (isFlipped ? 'b' : 'w')}
              />

              {/* Tactile board hint bar */}
              <div className="w-full flex items-center justify-between text-[11px] pt-1 px-1" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-3">
                  <span>← → moves</span>
                  <span>Space play</span>
                  <span>F flip</span>
                  <span>Esc reset</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 opacity-80">
                  <span>Right-click drag: arrows</span>
                  <span>·</span>
                  <span>Right-click sq: mark</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-[520px] shrink-0">

              {sideView === 'review' ? (
                <GameReviewReport
                  moves={game.moves}
                  whitePlayer={game.metadata.white}
                  blackPlayer={game.metadata.black}
                  whiteElo={game.metadata.whiteElo ? parseInt(game.metadata.whiteElo, 10) : undefined}
                  blackElo={game.metadata.blackElo ? parseInt(game.metadata.blackElo, 10) : undefined}
                  openingName={game.openingName}
                  result={game.metadata.result}
                  onReviewMoves={() => {
                    setSideView('analysis')
                    setCurrentMoveIndex(0)
                  }}
                  onSelectClassificationFilter={(filter) => {
                    setSideView('analysis')
                    setMoveListFilter(filter as ClassFilter)
                  }}
                />
              ) : (
                <>
                  <MoveExplanation
                    currentMove={explorationState?.testMoveParsed || currentMove}
                    openingName={game.openingName}
                    ecoCode={game.ecoCode}
                    whitePlayer={game.metadata.white}
                    blackPlayer={game.metadata.black}
                    isExploration={Boolean(explorationState)}
                  />
                  <MoveList
                    moves={game.moves}
                    currentIndex={currentMoveIndex}
                    onSelectMove={(idx) => {
                      setExplorationState(null)
                      setCurrentMoveIndex(idx)
                    }}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onFirst={handleFirst}
                    onLast={handleLast}
                    onFlip={handleFlip}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying((p) => !p)}
                    filterCritical={filterCritical}
                    onToggleFilterCritical={() => setFilterCritical((f) => !f)}
                    isAnalyzing={isAnalyzing}
                    playSpeed={playSpeed}
                    onSpeedChange={setPlaySpeed}
                    activeFilter={moveListFilter}
                    onFilterChange={setMoveListFilter}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
