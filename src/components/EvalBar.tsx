import React from 'react'

interface EvalBarProps {
  evaluation?: number // in centipawns (+100 = +1.0)
  mate?: number
  isFlipped?: boolean
}

/**
 * Authentic Chess.com Evaluation Bar
 * - Matches Chess.com proportions, styling, and typography
 * - Smooth cubic-bezier fill transitions
 * - Dynamic placement: score at bottom for White advantage, top for Black advantage
 * - Sleek 50% equilibrium marker
 */
export const EvalBar: React.FC<EvalBarProps> = ({
  evaluation = 0,
  mate,
  isFlipped = false
}) => {
  // Calculate winning chances percentage (0 to 100% white)
  let whitePercent = 50
  if (typeof mate === 'number') {
    whitePercent = mate > 0 ? 100 : 0
  } else {
    // Sigmoidal winning probability function matching Chess.com / Lichess
    const winProb = 2 / (1 + Math.exp(-0.00368208 * evaluation)) - 1
    whitePercent = Math.max(3, Math.min(97, 50 + 50 * winProb))
  }

  // Account for flipped board orientation
  const bottomPercent = isFlipped ? 100 - whitePercent : whitePercent

  // Display text formatted like Chess.com
  let displayText = '0.0'
  if (typeof mate === 'number') {
    displayText = `M${Math.abs(mate)}`
  } else {
    const val = Math.abs(evaluation / 100).toFixed(1)
    displayText = val
  }

  // Determine whether White or Black is leading
  const isWhiteLeading = typeof mate === 'number' ? mate > 0 : evaluation >= 0
  // Position text in the leading player's territory
  const showTextAtTop = isFlipped ? isWhiteLeading : !isWhiteLeading

  // Colors: Chess.com exact shades
  const whiteColor = '#ffffff'
  const blackColor = '#312e2b'

  const topColor = isFlipped ? whiteColor : blackColor
  const bottomColor = isFlipped ? blackColor : whiteColor

  return (
    <div
      className="relative flex flex-col w-[26px] self-stretch select-none overflow-hidden shrink-0 rounded-[3px] shadow-sm"
      style={{
        border: '1px solid rgba(0, 0, 0, 0.25)',
        backgroundColor: blackColor
      }}
      title={`Evaluation: ${evaluation >= 0 ? '+' : ''}${(evaluation / 100).toFixed(2)}`}
    >
      {/* Top Section */}
      <div
        className="w-full"
        style={{
          height: `${100 - bottomPercent}%`,
          backgroundColor: topColor,
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {/* Bottom Section */}
      <div
        className="w-full"
        style={{
          height: `${bottomPercent}%`,
          backgroundColor: bottomColor,
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {/* 50% Equilibrium Baseline Mark */}
      <div
        className="absolute top-1/2 left-0 right-0 h-[1px] pointer-events-none opacity-40 z-10"
        style={{
          backgroundColor: 'rgba(128, 128, 128, 0.6)'
        }}
      />

      {/* Evaluation Number Badge (Chess.com layout) */}
      <div
        className="absolute inset-x-0 flex justify-center pointer-events-none z-20"
        style={showTextAtTop ? { top: '6px' } : { bottom: '6px' }}
      >
        <span
          className="font-sans text-[11px] font-extrabold leading-none px-0.5 tracking-tight"
          style={{
            color: showTextAtTop
              ? (topColor === whiteColor ? '#312e2b' : '#ffffff')
              : (bottomColor === whiteColor ? '#312e2b' : '#ffffff'),
            textShadow: showTextAtTop && topColor !== whiteColor ? '0 1px 2px rgba(0,0,0,0.6)' : 'none'
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  )
}
