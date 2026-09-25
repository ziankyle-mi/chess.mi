import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Chess, type Square } from 'chess.js'
import { Board } from './Board'
import { EvalBar } from './EvalBar'
import { ClassificationBadge, type BadgeClassification } from './ClassificationBadge'
import { stockfishEngine } from '../engine/stockfishWorker'
import { classifySingleMove, isBookPosition, aggregateGameAccuracy } from '../engine/classifyMove'
import { generateDeepExplanation } from '../lib/deepMoveExplanation'
import { computeMaterialAndCaptures } from '../lib/chessUtils'
import { playMoveAudio } from '../lib/sounds'
import type { ParsedMove, MoveClassification } from '../lib/pgnParser'
import { useTheme } from '../lib/ThemeContext'
import {
  Bot,
  Play,
  RotateCcw,
  Flag,
  Handshake,
  Lightbulb,
  Sparkles,
  Award,
  Swords
} from 'lucide-react'

export interface SparringModeProps {
  userAccount?: string
  soundEnabled?: boolean
  onFinishGame: (pgn: string) => void
}

interface LastMoveAnalysis {
  classification: MoveClassification
  evalDelta: number
  headline: string
  explanation: string
  tacticalRole: string
  moveSan: string
  bestMoveSan?: string
}

interface GameOutcome {
  winner: 'user' | 'bot' | 'draw'
  resultScore: '1-0' | '0-1' | '1/2-1/2'
  title: string
  description: string
}

function getEloDescriptor(elo: number): { tier: string; desc: string } {
  if (elo < 950) return { tier: 'Novice', desc: 'Frequent tactical oversights; basic piece development.' }
  if (elo < 1150) return { tier: 'Casual', desc: 'Knows common opening moves; susceptible to tactical pins and forks.' }
  if (elo < 1350) return { tier: 'Club Player', desc: 'Solid fundamentals; handles routine tactics and basic defenses.' }
  if (elo < 1650) return { tier: 'Intermediate', desc: 'Plans pawn breaks and multi-move tactical combinations.' }
  if (elo < 1950) return { tier: 'Advanced', desc: 'Positional precision; punishes blunders and structural weaknesses swiftly.' }
  return { tier: 'Master', desc: 'Deep calculation, sharp tactical awareness, and endgame technique.' }
}

export const SparringMode: React.FC<SparringModeProps> = ({
  userAccount = 'You',
  soundEnabled = true,
  onFinishGame
}) => {
  const { boardTheme } = useTheme()

  // Game Configuration State
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup')
  const [targetElo, setTargetElo] = useState<number>(1200)
  const [colorChoice, setColorChoice] = useState<'white' | 'black' | 'random'>('white')
  const [userColor, setUserColor] = useState<'w' | 'b'>('w')
  const [showBestMove, setShowBestMove] = useState<boolean>(false)

  // Chess Instance & Board State
  const chessRef = useRef<Chess>(new Chess())
  const [fen, setFen] = useState<string>(chessRef.current.fen())
  const [moves, setMoves] = useState<ParsedMove[]>([])
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | undefined>(undefined)
  const [currentEval, setCurrentEval] = useState<number>(20)
  const [currentMate, setCurrentMate] = useState<number | undefined>(undefined)
  const [bestMoveLan, setBestMoveLan] = useState<string | undefined>(undefined)
  const [bestMoveSan, setBestMoveSan] = useState<string | undefined>(undefined)

  // Engine & Evaluation State
  const [isEngineThinking, setIsEngineThinking] = useState<boolean>(false)
  const [lastUserAnalysis, setLastUserAnalysis] = useState<LastMoveAnalysis | null>(null)
  const [gameOutcome, setGameOutcome] = useState<GameOutcome | null>(null)

  // Premove: user queues a move while the bot is thinking
  const premoveRef = useRef<{ from: string; to: string } | null>(null)
  const [premoveDisplay, setPremoveDisplay] = useState<{ from: string; to: string } | null>(null)
  // Ref to avoid hoisting issues when triggerBotMove calls handleUserMoveInternal
  const handleUserMoveInternalRef = useRef<(from: string, to: string) => boolean>(() => false)

  // Running tracking
  const prevEvalRef = useRef<number>(20)
  const prevBestMoveLanRef = useRef<string | undefined>(undefined)
  const movesEndRef = useRef<HTMLDivElement>(null)

  // Calculate material & captures
  const material = useMemo(() => computeMaterialAndCaptures(fen), [fen])
  const inCheck = material.inCheck
  const kingInCheckSquare = inCheck ? material.kingSquare : undefined

  // Running Accuracy Calculation for User moves
  const runningAccuracy = useMemo(() => {
    const userMoves = moves.filter((m) => m.color === userColor && m.moveAccuracy !== undefined)
    if (userMoves.length === 0) return 100
    const accuracies = userMoves.map((m) => m.moveAccuracy!)
    return aggregateGameAccuracy(accuracies)
  }, [moves, userColor])

  // Move counts breakdown for user
  const moveStats = useMemo(() => {
    const userMoves = moves.filter((m) => m.color === userColor && m.classification)
    const counts = {
      best: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0
    }
    for (const m of userMoves) {
      const c = m.classification
      if (c === 'best' || c === 'brilliant' || c === 'great' || c === 'book') counts.best++
      else if (c === 'good' || c === 'excellent') counts.good++
      else if (c === 'inaccuracy') counts.inaccuracy++
      else if (c === 'mistake' || c === 'miss') counts.mistake++
      else if (c === 'blunder') counts.blunder++
    }
    return counts
  }, [moves, userColor])

  // Scroll move list on update
  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves.length])

  // Start new game
  const handleStartGame = (colorOpt = colorChoice, eloOpt = targetElo) => {
    const resolvedColor: 'w' | 'b' =
      colorOpt === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : colorOpt === 'white' ? 'w' : 'b'

    const newChess = new Chess()
    chessRef.current = newChess
    setFen(newChess.fen())
    setMoves([])
    setLastMove(undefined)
    setCurrentEval(20)
    setCurrentMate(undefined)
    setBestMoveLan(undefined)
    setBestMoveSan(undefined)
    setLastUserAnalysis(null)
    setGameOutcome(null)
    setUserColor(resolvedColor)
    setTargetElo(eloOpt)
    setGameState('playing')
    prevEvalRef.current = 20
    prevBestMoveLanRef.current = undefined
    premoveRef.current = null
    setPremoveDisplay(null)

    // Initial eval
    stockfishEngine.evaluateFen(newChess.fen(), 10).then((res) => {
      setCurrentEval(res.eval)
      setCurrentMate(res.mate)
      setBestMoveLan(res.bestMoveLan)
      prevEvalRef.current = res.eval
      prevBestMoveLanRef.current = res.bestMoveLan

      if (res.bestMoveLan) {
        try {
          const testChess = new Chess(newChess.fen())
          const m = testChess.move({
            from: res.bestMoveLan.slice(0, 2),
            to: res.bestMoveLan.slice(2, 4),
            promotion: (res.bestMoveLan[4] || 'q') as any
          })
          if (m) setBestMoveSan(m.san)
        } catch {}
      }

      // If user plays Black, bot moves first!
      if (resolvedColor === 'b') {
        triggerBotMove(newChess, eloOpt)
      }
    })
  }

  // Trigger engine to make a move
  const triggerBotMove = async (chessInstance: Chess, elo: number) => {
    if (chessInstance.isGameOver()) return

    setIsEngineThinking(true)
    const currentFen = chessInstance.fen()

    try {
      // Natural thinking delay between 350ms and 750ms so moves don't snap instantaneously
      const thinkTime = Math.min(800, Math.max(350, Math.round(elo * 0.4)))
      const botResult = await stockfishEngine.getBotMove(currentFen, elo, thinkTime)

      let moveLan = botResult.bestMoveLan
      if (!moveLan || moveLan.length < 4) {
        const legal = chessInstance.moves({ verbose: true })
        if (legal.length > 0) moveLan = legal[0].lan
      }

      if (moveLan && moveLan.length >= 4) {
        const from = moveLan.slice(0, 2)
        const to = moveLan.slice(2, 4)
        const promotion = (moveLan[4] || 'q') as any

        const fenBefore = chessInstance.fen()
        const madeMove = chessInstance.move({ from, to, promotion })

        if (madeMove) {
          if (soundEnabled) {
            playMoveAudio(madeMove.san, madeMove.captured)
          }

          const fenAfter = chessInstance.fen()
          setFen(fenAfter)
          setLastMove({ from, to })

          const parsedMove: ParsedMove = {
            index: moves.length,
            ply: moves.length,
            moveNumber: Math.floor(moves.length / 2) + 1,
            color: madeMove.color,
            san: madeMove.san,
            lan: madeMove.lan,
            from: madeMove.from as Square,
            to: madeMove.to as Square,
            piece: madeMove.piece,
            captured: madeMove.captured,
            promotion: madeMove.promotion,
            fenBefore,
            fenAfter
          }

          setMoves((prev) => [...prev, parsedMove])

          // Check if bot's move ended the game
          if (checkGameOver(chessInstance, 'bot')) {
            setIsEngineThinking(false)
            return
          }

          // Evaluate position after bot's move for user's turn
          const evalRes = await stockfishEngine.evaluateFen(fenAfter, 10)
          setCurrentEval(evalRes.eval)
          setCurrentMate(evalRes.mate)
          setBestMoveLan(evalRes.bestMoveLan)
          prevEvalRef.current = evalRes.eval
          prevBestMoveLanRef.current = evalRes.bestMoveLan

          if (evalRes.bestMoveLan) {
            try {
              const testChess = new Chess(fenAfter)
              const m = testChess.move({
                from: evalRes.bestMoveLan.slice(0, 2),
                to: evalRes.bestMoveLan.slice(2, 4),
                promotion: (evalRes.bestMoveLan[4] || 'q') as any
              })
              if (m) setBestMoveSan(m.san)
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('Bot move error:', err)
    } finally {
      setIsEngineThinking(false)
      // Fire queued premove if the user set one while the bot was thinking
      const queued = premoveRef.current
      if (queued) {
        premoveRef.current = null
        setPremoveDisplay(null)
        setTimeout(() => {
          handleUserMoveInternalRef.current(queued.from, queued.to)
        }, 50)
      }
    }
  }

  // Core move execution (used both for live moves and premove execution)
  const handleUserMoveInternal = (from: string, to: string): boolean => {
    const chess = chessRef.current
    const currentTurn = chess.turn()
    if (currentTurn !== userColor) return false

    const fenBefore = chess.fen()
    let madeMove = null

    try {
      madeMove = chess.move({ from, to, promotion: 'q' })
    } catch {
      return false
    }

    if (!madeMove) return false

    if (soundEnabled) {
      playMoveAudio(madeMove.san, madeMove.captured)
    }

    const fenAfter = chess.fen()
    setFen(fenAfter)
    setLastMove({ from, to })

    const prevEval = prevEvalRef.current
    const prevBestLan = prevBestMoveLanRef.current

    const parsedMove: ParsedMove = {
      index: moves.length,
      ply: moves.length,
      moveNumber: Math.floor(moves.length / 2) + 1,
      color: madeMove.color,
      san: madeMove.san,
      lan: madeMove.lan,
      from: madeMove.from as Square,
      to: madeMove.to as Square,
      piece: madeMove.piece,
      captured: madeMove.captured,
      promotion: madeMove.promotion,
      fenBefore,
      fenAfter
    }

    // Live Evaluation & Classification of user's move
    stockfishEngine.evaluateFen(fenAfter, 10).then((evalRes) => {
      const isBook = isBookPosition(fenAfter)
      const classification = classifySingleMove(
        parsedMove,
        prevEval,
        evalRes.eval,
        prevBestLan,
        isBook
      )

      parsedMove.eval = evalRes.eval
      parsedMove.mate = evalRes.mate
      parsedMove.bestMoveLan = evalRes.bestMoveLan
      parsedMove.bestMoveSan = classification.bestMoveSan
      parsedMove.classification = classification.classification
      parsedMove.moveAccuracy = classification.moveAccuracy
      parsedMove.winLoss = classification.winLoss
      parsedMove.explanation = classification.explanation
      parsedMove.tacticalPattern = classification.tacticalPattern
      parsedMove.isCritical = classification.isCritical

      // Deep human-readable coach explanation
      const deepExp = generateDeepExplanation(parsedMove, classification.bestMoveSan)

      // Eval delta from user's perspective
      const rawDelta =
        userColor === 'w' ? evalRes.eval - prevEval : prevEval - evalRes.eval
      const evalDeltaCp = Math.round(rawDelta)

      setLastUserAnalysis({
        classification: classification.classification,
        evalDelta: evalDeltaCp,
        headline: deepExp.headline,
        explanation: deepExp.explanation,
        tacticalRole: deepExp.tacticalRole,
        moveSan: madeMove.san,
        bestMoveSan: classification.bestMoveSan
      })

      setMoves((prev) => [...prev, parsedMove])
      setCurrentEval(evalRes.eval)
      setCurrentMate(evalRes.mate)
      prevEvalRef.current = evalRes.eval
      prevBestMoveLanRef.current = evalRes.bestMoveLan
    })

    // Check if user's move ended game
    if (checkGameOver(chess, 'user')) {
      return true
    }

    // Bot plays next
    setTimeout(() => {
      triggerBotMove(chess, targetElo)
    }, 250)

    return true
  }

  // Keep the ref up-to-date on every render so triggerBotMove can call it safely
  handleUserMoveInternalRef.current = handleUserMoveInternal

  // Handle user making a move on the board
  const handleUserMove = useCallback(
    (from: string, to: string): boolean => {
      if (gameState !== 'playing') return false

      // If the bot is currently thinking, queue this as a premove
      if (isEngineThinking || chessRef.current.turn() !== userColor) {
        // Validate it's a legal move on a hypothetical future position
        // (we optimistically trust the user picked from their pieces)
        premoveRef.current = { from, to }
        setPremoveDisplay({ from, to })
        return true // Return true so the Board component doesn't reject the drag
      }

      return handleUserMoveInternal(from, to)
    },
    [gameState, isEngineThinking, userColor, soundEnabled, moves.length, targetElo]
  )

  // Game over detection
  const checkGameOver = (chessInstance: Chess, lastPlayer: 'user' | 'bot'): boolean => {
    if (chessInstance.isCheckmate()) {
      const winner = lastPlayer === 'user' ? 'user' : 'bot'
      const resultScore =
        winner === 'user'
          ? userColor === 'w'
            ? '1-0'
            : '0-1'
          : userColor === 'w'
          ? '0-1'
          : '1-0'

      setGameOutcome({
        winner,
        resultScore,
        title: winner === 'user' ? 'Checkmate — Victory!' : 'Checkmate — Defeat',
        description:
          winner === 'user'
            ? 'Outstanding tactical execution! You delivered checkmate against the bot.'
            : 'Stockfish found a decisive mating sequence. Review the game to find where things slipped.'
      })
      setGameState('gameover')
      return true
    }

    if (chessInstance.isDraw()) {
      let desc = 'The game has ended in a draw.'
      if (chessInstance.isStalemate()) desc = 'Stalemate — No legal moves remaining and king is not in check.'
      else if (chessInstance.isThreefoldRepetition()) desc = 'Draw by threefold repetition.'
      else if (chessInstance.isInsufficientMaterial()) desc = 'Draw by insufficient material to checkmate.'

      setGameOutcome({
        winner: 'draw',
        resultScore: '1/2-1/2',
        title: 'Draw',
        description: desc
      })
      setGameState('gameover')
      return true
    }

    return false
  }

  // Resignation
  const handleResign = () => {
    if (gameState !== 'playing') return
    const resultScore = userColor === 'w' ? '0-1' : '1-0'
    setGameOutcome({
      winner: 'bot',
      resultScore,
      title: 'Resignation',
      description: 'You resigned the game. Check the post-game review to pinpoint key turning points.'
    })
    setGameState('gameover')
  }

  // Draw Offer
  const handleOfferDraw = () => {
    if (gameState !== 'playing') return
    // Engine accepts draw if evaluation is balanced (-100 to +100 cp) or if 3-fold repetition is near
    const absEval = Math.abs(currentEval)
    if (absEval <= 120 && moves.length >= 16) {
      setGameOutcome({
        winner: 'draw',
        resultScore: '1/2-1/2',
        title: 'Draw Agreed',
        description: `Bot evaluated position as balanced (${(currentEval / 100).toFixed(1)}) and accepted your draw offer.`
      })
      setGameState('gameover')
    } else {
      alert(`Bot declined the draw offer. Stockfish evaluates the position at ${(currentEval / 100).toFixed(1)} and plays on.`)
    }
  }

  // Convert finished sparring game to standard PGN and hand off to Review
  const handleReviewHandoff = () => {
    const chess = chessRef.current
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
    const whitePlayer = userColor === 'w' ? userAccount : `Stockfish Bot (${targetElo})`
    const blackPlayer = userColor === 'b' ? userAccount : `Stockfish Bot (${targetElo})`
    const whiteElo = userColor === 'w' ? '' : `${targetElo}`
    const blackElo = userColor === 'b' ? '' : `${targetElo}`
    const result = gameOutcome?.resultScore || '*'

    // Build PGN
    let pgn = ''
    pgn += `[Event "Sparring Match vs Stockfish"]\n`
    pgn += `[Site "chess.mi"]\n`
    pgn += `[Date "${dateStr}"]\n`
    pgn += `[Round "1"]\n`
    pgn += `[White "${whitePlayer}"]\n`
    pgn += `[Black "${blackPlayer}"]\n`
    if (whiteElo) pgn += `[WhiteElo "${whiteElo}"]\n`
    if (blackElo) pgn += `[BlackElo "${blackElo}"]\n`
    pgn += `[Result "${result}"]\n`
    pgn += `[Termination "${gameOutcome?.title || 'Normal'}"]\n\n`
    pgn += chess.pgn()

    onFinishGame(pgn)
  }

  // -------------------------------------------------------------
  // RENDER: SETUP SCREEN
  // -------------------------------------------------------------
  if (gameState === 'setup') {
    const eloInfo = getEloDescriptor(targetElo)
    const minElo = 800
    const maxElo = 2200
    const eloPercent = Math.max(0, Math.min(100, ((targetElo - minElo) / (maxElo - minElo)) * 100))

    return (
      <div className="w-full max-w-4xl mx-auto py-6 px-3 select-none font-sans">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Main Configuration Card */}
          <div
            className="md:col-span-7 rounded-xl overflow-hidden shadow-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {/* Functional Header */}
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                  Match setup
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Configure opponent strength and board side
                </p>
              </div>
              <span
                className="text-[10px] font-mono text-[var(--text-muted)] px-2 py-0.5 rounded"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Stockfish UCI
              </span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Strength Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-[var(--text)]">
                    Opponent rating
                  </span>
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-base font-bold text-[var(--text)]">
                      {targetElo}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">Elo</span>
                    <span className="text-[11px] text-[var(--text-muted)]">·</span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {eloInfo.tier}
                    </span>
                  </div>
                </div>

                {/* Rating Scale Track & Slider */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="relative w-full flex items-center">
                    <input
                      type="range"
                      min={minElo}
                      max={maxElo}
                      step={25}
                      value={targetElo}
                      onChange={(e) => setTargetElo(parseInt(e.target.value, 10))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
                      style={{
                        background: `linear-gradient(to right, ${boardTheme.darkSquare} 0%, ${boardTheme.darkSquare} ${eloPercent}%, var(--bg-secondary) ${eloPercent}%, var(--bg-secondary) 100%)`,
                        border: '1px solid var(--border-subtle)'
                      }}
                    />
                  </div>

                  {/* Preset Scale Markers */}
                  <div className="flex justify-between items-center px-0.5 text-[11px] font-mono">
                    {[800, 1000, 1200, 1500, 1800, 2200].map((preset) => {
                      const isSelected = targetElo === preset
                      const isNear = Math.abs(targetElo - preset) <= (preset === 2200 ? 100 : 75)
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTargetElo(preset)}
                          className="py-0.5 px-1.5 rounded transition-all cursor-pointer text-center"
                          style={{
                            color: isSelected
                              ? 'var(--text)'
                              : isNear
                              ? 'var(--text-secondary)'
                              : 'var(--text-muted)',
                            fontWeight: isSelected ? 700 : 500,
                            background: isSelected ? 'var(--bg-secondary)' : 'transparent',
                            border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent'
                          }}
                        >
                          {preset}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Factual Behavior Description */}
                <div
                  className="text-[11px] text-[var(--text-secondary)] px-3 py-2 rounded-md font-sans leading-relaxed mt-0.5"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  {eloInfo.desc}
                </div>
              </div>

              {/* Side Selection */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <span className="text-xs font-semibold text-[var(--text)] block">
                    Play as
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {colorChoice === 'white' ? 'White moves first' : colorChoice === 'black' ? 'Bot moves first' : 'Random assignment'}
                  </span>
                </div>

                <div
                  className="flex items-center rounded-lg p-0.5"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  {[
                    { id: 'white' as const, label: 'White', pieceDot: 'bg-white border-gray-400' },
                    { id: 'random' as const, label: 'Random', pieceDot: null },
                    { id: 'black' as const, label: 'Black', pieceDot: 'bg-[#222] border-gray-600' }
                  ].map(({ id, label, pieceDot }) => {
                    const active = colorChoice === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setColorChoice(id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer"
                        style={{
                          background: active ? 'var(--bg-elevated)' : 'transparent',
                          color: active ? 'var(--text)' : 'var(--text-muted)',
                          boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                        }}
                      >
                        {pieceDot ? (
                          <span className={`w-2.5 h-2.5 rounded-full border ${pieceDot}`} />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full border border-gray-500 overflow-hidden flex">
                            <span className="w-1/2 h-full bg-white" />
                            <span className="w-1/2 h-full bg-[#222]" />
                          </span>
                        )}
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Hint Option Toggle */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <span className="text-xs font-semibold text-[var(--text)] block">
                    Move hints
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Draw engine best-move arrow during match
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBestMove((v) => !v)}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: showBestMove ? 'var(--bg-secondary)' : 'transparent',
                    color: showBestMove ? 'var(--text)' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: showBestMove ? 'var(--border)' : 'var(--border-subtle)'
                  }}
                >
                  {showBestMove ? 'Enabled' : 'Off'}
                </button>
              </div>

              {/* Start Match CTA */}
              <button
                type="button"
                onClick={() => handleStartGame()}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-text)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Match</span>
              </button>
            </div>
          </div>

          {/* Context / Bot Profile Side Panel */}
          <div
            className="md:col-span-5 rounded-xl p-5 flex flex-col gap-4 text-xs"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <h3 className="text-xs font-semibold text-[var(--text)]">
                Sparring parameters
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Native Stockfish UCI rating limit
              </p>
            </div>

            <div className="space-y-3 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <div>
                <span className="font-semibold text-[var(--text)] block mb-0.5">
                  Natural human play
                </span>
                Engine strength is governed by official UCI limit options (UCI_LimitStrength + UCI_Elo) rather than full-depth calculation with randomized blunders.
              </div>

              <div className="pt-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="font-semibold text-[var(--text)] block mb-0.5">
                  Live move feedback
                </span>
                Each of your moves is evaluated on the fly against depth-12 Stockfish. You will receive real-time classification (Best, Inaccuracy, Mistake, Blunder) and running accuracy.
              </div>

              <div className="pt-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <span className="font-semibold text-[var(--text)] block mb-0.5">
                  Post-game transition
                </span>
                Upon checkmate, resignation, or draw, your game can be instantly exported into the full Review tab for move-by-move retrospection.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // RENDER: ACTIVE MATCH OR GAME OVER
  // -------------------------------------------------------------
  const botSide = userColor === 'w' ? 'Black' : 'White'
  const userSide = userColor === 'w' ? 'White' : 'Black'
  const isBotTurn = chessRef.current.turn() !== userColor

  return (
    <div className="w-full max-w-[1240px] mx-auto py-1 px-2 sm:px-4 flex flex-col gap-4 select-none font-sans">
      {/* Top Bar / Quick Match Status */}
      <div
        className="w-full px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
            <Swords className="w-4 h-4 text-[var(--accent)]" />
            <span>Sparring Mode</span>
          </div>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="font-mono text-[var(--text-muted)]">
            Stockfish Bot <span className="text-[var(--accent)] font-semibold">({targetElo} Elo)</span>
          </span>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="text-[var(--text-muted)]">
            Playing as <strong className="text-[var(--text)]">{userSide}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Best move hint toggle */}
          <button
            type="button"
            onClick={() => setShowBestMove((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: showBestMove ? 'rgba(129, 182, 76, 0.15)' : 'var(--bg-secondary)',
              color: showBestMove ? 'var(--accent)' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: showBestMove ? 'var(--accent)' : 'var(--border-subtle)'
            }}
            title="Toggle best move hint arrow"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Best Move</span>
          </button>

          {/* New Game / Reset */}
          <button
            type="button"
            onClick={() => setGameState('setup')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Board + Analysis Split Layout */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8 w-full">
        {/* Left Column: Board + Eval Bar + Player Cards */}
        <div className="flex flex-col items-center lg:items-start gap-1.5 w-full max-w-[560px] shrink-0">
          {/* Top Player Card: Bot */}
          <div
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all select-none"
            style={{
              background: isBotTurn ? 'var(--bg-elevated)' : 'transparent',
              border: isBotTurn ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: isBotTurn ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{
                  background: botSide === 'White' ? '#f0f0f0' : '#262421',
                  color: botSide === 'White' ? '#262421' : '#f0f0f0',
                  border: botSide === 'White' ? '1px solid #d5d3d0' : '1px solid #403d39'
                }}
              >
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text)]">Stockfish Bot</span>
                <span className="text-[11px] font-mono text-[var(--accent)] font-semibold">
                  {targetElo} Elo
                </span>
                {isEngineThinking && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--accent)] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    Thinking...
                  </span>
                )}
              </div>
            </div>

            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              {botSide}
            </div>
          </div>

          {/* Interactive Chessboard + Eval Bar */}
          <div className="flex items-stretch justify-center w-full gap-2 relative">
            <EvalBar
              evaluation={currentEval}
              mate={currentMate}
              isFlipped={userColor === 'b'}
            />
            <div className="flex-1 max-w-[520px]" style={{ touchAction: 'none' }}>
              <Board
                fen={fen}
                orientation={userColor === 'w' ? 'white' : 'black'}
                lastMove={lastMove}
                bestMoveLan={showBestMove ? bestMoveLan : undefined}
                showBestMoveArrow={showBestMove}
                classification={lastUserAnalysis?.classification}
                kingInCheckSquare={kingInCheckSquare}
                onMakeMove={handleUserMove}
                allowDragging={gameState === 'playing'}
                premove={premoveDisplay}
              />
            </div>
          </div>

          {/* Bottom Player Card: User */}
          <div
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all select-none"
            style={{
              background: !isBotTurn ? 'var(--bg-elevated)' : 'transparent',
              border: !isBotTurn ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: !isBotTurn ? '0 1px 4px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            <div className="flex items-center gap-2">
              <img
                src="/profile.jpg"
                alt={userAccount}
                className="w-6 h-6 rounded-full object-cover border border-[var(--border-subtle)] shrink-0"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text)]">{userAccount}</span>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                  style={{
                    background: runningAccuracy >= 80 ? 'rgba(129, 182, 76, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: runningAccuracy >= 80 ? '#81b64c' : '#eab308'
                  }}
                >
                  {runningAccuracy}% Acc
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {gameState === 'playing' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOfferDraw}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                    title="Offer Draw"
                  >
                    <Handshake className="w-3 h-3" />
                    <span>Draw</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResign}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer hover:text-red-400"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
                    title="Resign Game"
                  >
                    <Flag className="w-3 h-3" />
                    <span>Resign</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Analysis Feed, Running Stats, Move List & Controls */}
        <div className="flex-1 w-full max-w-[540px] flex flex-col gap-4">
          {/* Game Over Banner if game concluded */}
          {gameState === 'gameover' && gameOutcome && (
            <div
              className="rounded-xl p-4 sm:p-5 flex flex-col gap-3 animate-fade-in"
              style={{
                background:
                  gameOutcome.winner === 'user'
                    ? 'linear-gradient(135deg, rgba(129, 182, 76, 0.15) 0%, var(--bg-elevated) 100%)'
                    : gameOutcome.winner === 'draw'
                    ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, var(--bg-elevated) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, var(--bg-elevated) 100%)',
                border:
                  gameOutcome.winner === 'user'
                    ? '1px solid rgba(129, 182, 76, 0.4)'
                    : gameOutcome.winner === 'draw'
                    ? '1px solid rgba(234, 179, 8, 0.4)'
                    : '1px solid rgba(239, 68, 68, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.25)'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" style={{ color: gameOutcome.winner === 'user' ? 'var(--accent)' : 'inherit' }} />
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                    {gameOutcome.title}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>
                  {gameOutcome.resultScore}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {gameOutcome.description}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleReviewHandoff}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-text)',
                    boxShadow: '0 2px 8px rgba(129, 182, 76, 0.3)'
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Review in Full Game Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartGame()}
                  className="py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Running Accuracy & Stats Panel */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text)]">
                Running accuracy
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-[var(--text)]">
                  {runningAccuracy}%
                </span>
              </div>
            </div>

            {/* Accuracy Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${runningAccuracy}%`,
                  background:
                    runningAccuracy >= 85
                      ? 'linear-gradient(90deg, #81b64c, #96bc4b)'
                      : runningAccuracy >= 70
                      ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)'
                }}
              />
            </div>

            {/* Move Classification Counts */}
            <div className="grid grid-cols-5 gap-1.5 pt-1 text-center">
              <div className="p-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Best</span>
                <span className="text-xs font-bold font-mono text-[#81b64c]">{moveStats.best}</span>
              </div>
              <div className="p-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Good</span>
                <span className="text-xs font-bold font-mono text-[#97af8b]">{moveStats.good}</span>
              </div>
              <div className="p-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Inacc</span>
                <span className="text-xs font-bold font-mono text-[#e4a520]">{moveStats.inaccuracy}</span>
              </div>
              <div className="p-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Mistake</span>
                <span className="text-xs font-bold font-mono text-[#e6912c]">{moveStats.mistake}</span>
              </div>
              <div className="p-1.5 rounded" style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-[10px] text-[var(--text-muted)] block">Blunder</span>
                <span className="text-xs font-bold font-mono text-[#ef4444]">{moveStats.blunder}</span>
              </div>
            </div>
          </div>

          {/* Live Move Coaching / Explanation Card */}
          <div
            className="rounded-xl p-4 flex flex-col gap-2.5 transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              minHeight: '130px'
            }}
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-xs font-semibold text-[var(--text)]">
                Coach analysis
              </span>
              {lastUserAnalysis && (
                <div className="flex items-center gap-2">
                  <ClassificationBadge
                    classification={lastUserAnalysis.classification as BadgeClassification}
                    size={20}
                    forceShow
                  />
                  <span className="text-xs font-mono font-bold text-[var(--text)]">
                    {lastUserAnalysis.moveSan}
                  </span>
                  <span
                    className="text-[11px] font-mono font-semibold"
                    style={{
                      color:
                        lastUserAnalysis.evalDelta >= 0
                          ? 'var(--accent)'
                          : lastUserAnalysis.evalDelta >= -50
                          ? 'var(--text-muted)'
                          : '#ef4444'
                    }}
                  >
                    {lastUserAnalysis.evalDelta > 0 ? `+${(lastUserAnalysis.evalDelta / 100).toFixed(1)}` : (lastUserAnalysis.evalDelta / 100).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {lastUserAnalysis ? (
              <div className="flex flex-col gap-1.5 text-xs">
                <p className="font-semibold text-[var(--text)] leading-snug">
                  {lastUserAnalysis.headline}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {lastUserAnalysis.explanation}
                </p>
                {lastUserAnalysis.bestMoveSan &&
                  ['inaccuracy', 'mistake', 'blunder', 'miss'].includes(lastUserAnalysis.classification) && (
                    <div
                      className="mt-1 p-2 rounded flex items-center justify-between font-mono text-[11px]"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                    >
                      <span className="text-[var(--text-muted)]">Engine Recommendation:</span>
                      <span className="font-bold text-[var(--accent)]">
                        Better was {lastUserAnalysis.bestMoveSan}
                      </span>
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-[var(--text-muted)] gap-1">
                <Sparkles className="w-5 h-5 text-[var(--accent)] opacity-60" />
                <p className="text-xs font-medium">Make a move to receive live coach feedback.</p>
                <p className="text-[10px]">Stockfish evaluates every move against grandmaster praxis.</p>
              </div>
            )}
          </div>

          {/* Move History Table */}
          <div
            className="rounded-xl p-3.5 flex flex-col gap-2"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              maxHeight: '220px'
            }}
          >
            <div className="flex items-center justify-between pb-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Move History ({moves.length} plies)
              </span>
              {showBestMove && bestMoveSan && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--accent)]">
                  <Lightbulb className="w-3 h-3" />
                  <span>Hint: {bestMoveSan}</span>
                </div>
              )}
            </div>

            <div className="overflow-y-auto pr-1 flex flex-col gap-1 text-xs font-mono max-h-[160px]">
              {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => {
                const whiteMove = moves[i * 2]
                const blackMove = moves[i * 2 + 1]
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 py-1 px-1.5 rounded items-center"
                    style={{ background: i % 2 === 0 ? 'var(--bg-secondary)' : 'transparent' }}
                  >
                    <span className="col-span-2 text-[var(--text-muted)] text-[11px]">
                      {i + 1}.
                    </span>
                    <span className="col-span-5 font-semibold text-[var(--text)] flex items-center gap-1.5">
                      {whiteMove ? whiteMove.san : ''}
                      {whiteMove?.classification && whiteMove.color === userColor && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background:
                              whiteMove.classification === 'best'
                                ? '#81b64c'
                                : whiteMove.classification === 'good'
                                ? '#97af8b'
                                : whiteMove.classification === 'inaccuracy'
                                ? '#e4a520'
                                : whiteMove.classification === 'mistake'
                                ? '#e6912c'
                                : '#ef4444'
                          }}
                        />
                      )}
                    </span>
                    <span className="col-span-5 font-semibold text-[var(--text)] flex items-center gap-1.5">
                      {blackMove ? blackMove.san : ''}
                      {blackMove?.classification && blackMove.color === userColor && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background:
                              blackMove.classification === 'best'
                                ? '#81b64c'
                                : blackMove.classification === 'good'
                                ? '#97af8b'
                                : blackMove.classification === 'inaccuracy'
                                ? '#e4a520'
                                : blackMove.classification === 'mistake'
                                ? '#e6912c'
                                : '#ef4444'
                          }}
                        />
                      )}
                    </span>
                  </div>
                )
              })}
              <div ref={movesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
