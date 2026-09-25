/**
 * Authentic Chess.com Marble Sound System
 * Plays the official crisp Chess.com marble piece sound effect on moves and captures.
 */

let audioCtx: AudioContext | null = null
let moveBuffer: AudioBuffer | null = null
let captureBuffer: AudioBuffer | null = null
let isPreloading = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) {
      audioCtx = new AudioCtx()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

async function loadBuffer(url: string, ctx: AudioContext): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(url)
    const arrayBuf = await res.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuf)
  } catch {
    return null
  }
}

export async function preloadMarbleSounds(): Promise<void> {
  if (isPreloading || (moveBuffer && captureBuffer)) return
  isPreloading = true
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const [move, capture] = await Promise.all([
      loadBuffer('/sounds/marble-move.mp3', ctx),
      loadBuffer('/sounds/marble-capture.mp3', ctx)
    ])
    moveBuffer = move
    captureBuffer = capture
  } catch {
    // Fallbacks handled gracefully
  } finally {
    isPreloading = false
  }
}

// Preload on first load / module evaluation
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => preloadMarbleSounds(), { once: true })
  window.addEventListener('keydown', () => preloadMarbleSounds(), { once: true })
}

/**
 * Play authentic Chess.com marble sound
 */
export function playMarbleSound(isCapture = false): void {
  try {
    const ctx = getAudioContext()
    const targetBuffer = isCapture && captureBuffer ? captureBuffer : (moveBuffer || captureBuffer)

    if (ctx && targetBuffer) {
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      gain.gain.value = 0.85
      source.buffer = targetBuffer
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
      return
    }

    // Direct HTMLAudio fallback if AudioContext hasn't decoded yet
    const fallbackUrl = isCapture ? '/sounds/marble-capture.mp3' : '/sounds/marble-move.mp3'
    const audio = new Audio(fallbackUrl)
    audio.volume = 0.85
    audio.play().catch(() => {})
    if (!moveBuffer) preloadMarbleSounds()
  } catch {
    // Ignore autoplay restriction errors
  }
}

/**
 * Determines and plays sound — strictly uses Chess.com marble sound.
 */
export function playMoveAudio(san?: string, captured?: string): void {
  const isCapture = Boolean(captured || (san && san.includes('x')))
  playMarbleSound(isCapture)
}
