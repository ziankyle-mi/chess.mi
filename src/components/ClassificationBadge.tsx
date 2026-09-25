import React from 'react'

export type BadgeClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder'

export interface ClassificationBadgeProps {
  classification: BadgeClassification | string
  size?: number
  className?: string
  forceShow?: boolean
}

interface BadgeConfig {
  bgGradient: [string, string]
  label: string
}

const BADGE_CONFIGS: Record<string, BadgeConfig> = {
  brilliant: {
    bgGradient: ['#17988f', '#26c9a2'],
    label: 'Brilliant'
  },
  great: {
    bgGradient: ['#3e7bb0', '#5697d0'],
    label: 'Great Move'
  },
  best: {
    bgGradient: ['#7ea835', '#96bc4b'],
    label: 'Best'
  },
  excellent: {
    bgGradient: ['#82ac3a', '#9ec950'],
    label: 'Excellent'
  },
  good: {
    bgGradient: ['#7c9d70', '#97af8b'],
    label: 'Good'
  },
  book: {
    bgGradient: ['#886b4b', '#a88865'],
    label: 'Book'
  },
  inaccuracy: {
    bgGradient: ['#e4a520', '#f7c631'],
    label: 'Inaccuracy'
  },
  mistake: {
    bgGradient: ['#d17719', '#e6912c'],
    label: 'Mistake'
  },
  miss: {
    bgGradient: ['#c93a2f', '#e64e42'],
    label: 'Miss'
  },
  blunder: {
    bgGradient: ['#b22b28', '#ca3431'],
    label: 'Blunder'
  }
}

/**
 * Authentic, clean vector SVG badge for chess move evaluations.
 * Pure vector geometry — zero emojis or platform text artifacts.
 * Good and Great moves are hidden by default (matching Chess.com clean board/list)
 * unless forceShow is true (e.g. for breakdown tables and explanation cards).
 */
export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  size = 26,
  className = '',
  forceShow = false
}) => {
  const normClass = classification.toLowerCase()

  // Chess.com style: good and great moves do not display a badge on the board or move list
  if (!forceShow && (normClass === 'good' || normClass === 'great' || normClass === 'excellent')) {
    return null
  }

  const config = BADGE_CONFIGS[normClass] || BADGE_CONFIGS['good']
  const gradId = `badge-grad-${normClass}-${Math.round(size)}`

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'
      }}
      title={config.label}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor={config.bgGradient[1]} />
            <stop offset="1" stopColor={config.bgGradient[0]} />
          </linearGradient>
        </defs>

        {/* Circular Shield with gradient */}
        <circle cx="16" cy="16" r="14" fill={`url(#${gradId})`} />
        {/* Subtle top gloss highlight */}
        <circle cx="16" cy="16" r="14" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1" />
        {/* Outer White Rim */}
        <circle cx="16" cy="16" r="14" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="2" />

        {/* Inner Vector Artwork */}
        {normClass === 'book' && (
          /* High-craft vector open book */
          <g stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M16 11v11" />
            <path d="M16 11c-2.2-1.5-5.2-1.5-7.5 0v10.5c2.3-1.5 5.3-1.5 7.5 0" />
            <path d="M16 11c2.2-1.5 5.2-1.5 7.5 0v10.5c-2.3-1.5-5.3-1.5-7.5 0" />
          </g>
        )}

        {normClass === 'best' && (
          /* Crisp geometric 5-point star */
          <polygon
            points="16,6 18.9,12.2 25.5,12.8 20.4,17.2 22,23.8 16,20.2 10,23.8 11.6,17.2 6.5,12.8 13.1,12.2"
            fill="#ffffff"
          />
        )}

        {normClass === 'brilliant' && (
          /* Twin exclamation marks (!!) with geometric precision */
          <g fill="#ffffff">
            <path d="M12.5 7.5c.7 0 1.2.5 1.2 1.2l-.3 7.8c0 .6-.5 1-1.1 1-.6 0-1.1-.4-1.1-1l-.3-7.8c0-.7.6-1.2 1.6-1.2z" />
            <circle cx="12.3" cy="21.5" r="1.4" />
            <path d="M19.5 7.5c.7 0 1.2.5 1.2 1.2l-.3 7.8c0 .6-.5 1-1.1 1-.6 0-1.1-.4-1.1-1l-.3-7.8c0-.7.6-1.2 1.6-1.2z" />
            <circle cx="19.3" cy="21.5" r="1.4" />
          </g>
        )}

        {(normClass === 'excellent' || normClass === 'great' || normClass === 'good') && (
          /* Clean geometric checkmark */
          <path
            d="M9 16.5l4.5 4.5 9.5-10"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {normClass === 'miss' && (
          /* Clean geometric cross (X) */
          <g stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round">
            <line x1="11" y1="11" x2="21" y2="21" />
            <line x1="21" y1="11" x2="11" y2="21" />
          </g>
        )}

        {normClass === 'inaccuracy' && (
          /* Geometric ?! */
          <g fill="#ffffff" style={{ fontStyle: 'normal', fontWeight: 900 }}>
            <text
              x="16"
              y="22.5"
              textAnchor="middle"
              fontSize="16"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="-0.5px"
            >
              ?!
            </text>
          </g>
        )}

        {normClass === 'mistake' && (
          /* Geometric ? */
          <g fill="#ffffff">
            <text
              x="16"
              y="23"
              textAnchor="middle"
              fontSize="18"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fill="#ffffff"
            >
              ?
            </text>
          </g>
        )}

        {normClass === 'blunder' && (
          /* Geometric ?? */
          <g fill="#ffffff">
            <text
              x="16"
              y="22.5"
              textAnchor="middle"
              fontSize="15"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fill="#ffffff"
              letterSpacing="-1px"
            >
              ??
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
