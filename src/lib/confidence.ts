export type ConfidenceTier = 'early' | 'developing' | 'reliable'

export interface SampleConfidence {
  sampleSize: number
  tier: ConfidenceTier
  label: string
  caption: string
  isLowSample: boolean
  isReliable: boolean
}

/**
 * Returns a standardized sample size confidence object based on sample count.
 * - Under 10 games: 'early read' (low statistical confidence, visually lighter)
 * - 10–25 games: 'developing' (moderate confidence)
 * - 25+ games: 'reliable' (high statistical confidence)
 */
export function getSampleConfidence(sampleCount: number, unit = 'games'): SampleConfidence {
  const count = Math.max(0, sampleCount)
  if (count < 10) {
    const singular = unit.endsWith('s') ? unit.slice(0, -1) : unit
    return {
      sampleSize: count,
      tier: 'early',
      label: 'Early read',
      caption: `${count} ${count === 1 ? singular : unit} · early read`,
      isLowSample: true,
      isReliable: false
    }
  }
  if (count <= 25) {
    return {
      sampleSize: count,
      tier: 'developing',
      label: 'Developing',
      caption: `${count} ${unit} · developing sample`,
      isLowSample: false,
      isReliable: false
    }
  }
  return {
    sampleSize: count,
    tier: 'reliable',
    label: 'Reliable',
    caption: `${count} ${unit} · reliable sample`,
    isLowSample: false,
    isReliable: true
  }
}
