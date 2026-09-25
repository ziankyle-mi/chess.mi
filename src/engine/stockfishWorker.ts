import { evaluateStaticFen } from './simpleEvaluator'

export interface EngineEvalResult {
  eval: number // Centipawns from White's perspective (+100 = White +1.0)
  mate?: number // Positive = White mates in X, negative = Black mates in X
  bestMoveLan?: string
  pv?: string[]
  engineUsed: 'stockfish' | 'fallback'
}

class StockfishEngine {
  private worker: Worker | null = null
  private isReady = false
  private initPromise: Promise<boolean> | null = null
  private currentJob: {
    fen: string
    depth: number
    resolve: (res: EngineEvalResult) => void
    reject: (err: any) => void
    timer: any
  } | null = null

  constructor() {
    this.initEngine()
  }

  private initEngine(): Promise<boolean> {
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof Worker === 'undefined') {
        resolve(false)
        return
      }

      try {
        // Stockfish script in public/stockfish/stockfish.js
        this.worker = new Worker('/stockfish/stockfish.js')

        const timeout = setTimeout(() => {
          if (!this.isReady) {
            console.warn('Stockfish worker initialization timed out, using fallback evaluator.')
            resolve(false)
          }
        }, 5000)

        this.worker.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === 'string' ? e.data : ''
          this.handleEngineOutput(line)

          if (line.includes('uciok') || line.includes('readyok')) {
            this.isReady = true
            clearTimeout(timeout)
            resolve(true)
          }
        }

        this.worker.onerror = (err) => {
          console.warn('Stockfish worker error, fallback will be used:', err)
          clearTimeout(timeout)
          resolve(false)
        }

        this.worker.postMessage('uci')
        this.worker.postMessage('isready')
      } catch (err) {
        console.warn('Unable to instantiate Stockfish worker:', err)
        resolve(false)
      }
    })

    return this.initPromise
  }

  private handleEngineOutput(line: string) {
    if (!this.currentJob) return

    // Parse info score
    if (line.startsWith('bestmove')) {
      const parts = line.split(' ')
      const bestMoveLan = parts[1] && parts[1] !== '(none)' ? parts[1] : undefined

      clearTimeout(this.currentJob.timer)
      const resolve = this.currentJob.resolve
      this.currentJob = null

      // Check current stored best move/eval or fallback
      resolve(this.lastParsedEval || {
        eval: 0,
        bestMoveLan,
        engineUsed: 'stockfish'
      })
      this.lastParsedEval = null
      return
    }

    if (line.includes('info') && (line.includes('score cp') || line.includes('score mate'))) {
      const fenTurn = this.currentJob.fen.split(' ')[1] || 'w'
      let evalCp = 0
      let mateMoves: number | undefined

      const cpMatch = line.match(/score cp (-?\d+)/)
      if (cpMatch) {
        const rawCp = parseInt(cpMatch[1], 10)
        // UCI scores are relative to side to move! Convert to White's perspective:
        evalCp = fenTurn === 'w' ? rawCp : -rawCp
      }

      const mateMatch = line.match(/score mate (-?\d+)/)
      if (mateMatch) {
        const rawMate = parseInt(mateMatch[1], 10)
        mateMoves = fenTurn === 'w' ? rawMate : -rawMate
        evalCp = mateMoves > 0 ? 10000 - mateMoves * 100 : -10000 - mateMoves * 100
      }

      // Principal variation
      let pv: string[] = []
      const pvIndex = line.indexOf(' pv ')
      if (pvIndex !== -1) {
        pv = line.slice(pvIndex + 4).trim().split(/\s+/)
      }

      this.lastParsedEval = {
        eval: evalCp,
        mate: mateMoves,
        bestMoveLan: pv[0],
        pv,
        engineUsed: 'stockfish'
      }
    }
  }

  private lastParsedEval: EngineEvalResult | null = null

  public async evaluateFen(fen: string, depth = 12): Promise<EngineEvalResult> {
    const ready = await this.initEngine()

    if (!ready || !this.worker) {
      // Fallback static evaluation
      const staticRes = evaluateStaticFen(fen)
      return {
        eval: staticRes.eval,
        bestMoveLan: staticRes.bestMoveLan,
        engineUsed: 'fallback'
      }
    }

    return new Promise((resolve) => {
      // If previous job was running, stop it
      if (this.currentJob) {
        clearTimeout(this.currentJob.timer)
        this.worker?.postMessage('stop')
      }

      const timer = setTimeout(() => {
        if (this.currentJob) {
          console.warn('Evaluation timed out for FEN, using static eval:', fen)
          this.worker?.postMessage('stop')
          const staticRes = evaluateStaticFen(fen)
          resolve({
            eval: staticRes.eval,
            bestMoveLan: staticRes.bestMoveLan,
            engineUsed: 'fallback'
          })
          this.currentJob = null
        }
      }, 3000)

      this.lastParsedEval = null
      this.currentJob = {
        fen,
        depth,
        resolve,
        reject: () => {},
        timer
      }

      this.worker?.postMessage('setoption name UCI_LimitStrength value false')
      this.worker?.postMessage(`position fen ${fen}`)
      this.worker?.postMessage(`go depth ${depth}`)
    })
  }

  public async getBotMove(fen: string, elo: number, moveTimeMs = 500): Promise<EngineEvalResult> {
    const ready = await this.initEngine()
    const clampedElo = Math.max(800, Math.min(2850, elo))

    if (!ready || !this.worker) {
      const staticRes = evaluateStaticFen(fen)
      return {
        eval: staticRes.eval,
        bestMoveLan: staticRes.bestMoveLan,
        engineUsed: 'fallback'
      }
    }

    return new Promise((resolve) => {
      if (this.currentJob) {
        clearTimeout(this.currentJob.timer)
        this.worker?.postMessage('stop')
      }

      const timer = setTimeout(() => {
        if (this.currentJob) {
          console.warn('Bot move timed out, using fallback evaluator')
          this.worker?.postMessage('stop')
          const staticRes = evaluateStaticFen(fen)
          resolve({
            eval: staticRes.eval,
            bestMoveLan: staticRes.bestMoveLan,
            engineUsed: 'fallback'
          })
          this.currentJob = null
        }
      }, moveTimeMs + 3500)

      this.lastParsedEval = null
      this.currentJob = {
        fen,
        depth: 10,
        resolve,
        reject: () => {},
        timer
      }

      this.worker?.postMessage('setoption name UCI_LimitStrength value true')
      this.worker?.postMessage(`setoption name UCI_Elo value ${clampedElo}`)
      this.worker?.postMessage(`position fen ${fen}`)
      this.worker?.postMessage(`go movetime ${moveTimeMs}`)
    })
  }

  public stop() {
    if (this.worker) {
      this.worker.postMessage('stop')
    }
    if (this.currentJob) {
      clearTimeout(this.currentJob.timer)
      this.currentJob = null
    }
  }
}

export const stockfishEngine = new StockfishEngine()
