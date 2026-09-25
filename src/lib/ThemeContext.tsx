import React, { createContext, useContext, useState, useEffect } from 'react'

export interface BoardTheme {
  id: string
  name: string
  lightSquare: string
  darkSquare: string
  highlightLight: string
  highlightDark: string
  lastMoveLight: string
  lastMoveDark: string
  preview: [string, string] // [light, dark] for the theme picker swatch
}

export interface AppTheme {
  id: string
  name: string
  bg: string
  bgSecondary: string
  bgPanel: string
  bgElevated: string
  bgHover: string
  border: string
  borderSubtle: string
  text: string
  textSecondary: string
  textMuted: string
  accent: string
  accentText: string
  evalBarWhite: string
  evalBarBlack: string
  evalBadgeBg: string
  evalBadgeText: string
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'classic-green',
    name: 'Classic Green',
    lightSquare: '#eeeed2',
    darkSquare: '#769656',
    highlightLight: '#f6f669',
    highlightDark: '#baca44',
    lastMoveLight: 'rgba(255, 255, 60, 0.42)',
    lastMoveDark: 'rgba(155, 199, 0, 0.42)',
    preview: ['#eeeed2', '#769656']
  },
  {
    id: 'classic-brown',
    name: 'Classic Wood',
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    highlightLight: '#cdd26a',
    highlightDark: '#aaa23a',
    lastMoveLight: 'rgba(205, 210, 106, 0.42)',
    lastMoveDark: 'rgba(170, 162, 58, 0.42)',
    preview: ['#f0d9b5', '#b58863']
  },
  {
    id: 'ice',
    name: 'Ice Blue',
    lightSquare: '#dee3e6',
    darkSquare: '#8ca2ad',
    highlightLight: '#c3d887',
    highlightDark: '#92b36b',
    lastMoveLight: 'rgba(195, 216, 135, 0.42)',
    lastMoveDark: 'rgba(146, 179, 107, 0.42)',
    preview: ['#dee3e6', '#8ca2ad']
  },
  {
    id: 'walnut',
    name: 'Walnut',
    lightSquare: '#d8c5a2',
    darkSquare: '#82634e',
    highlightLight: '#dbc574',
    highlightDark: '#a5883a',
    lastMoveLight: 'rgba(219, 197, 116, 0.42)',
    lastMoveDark: 'rgba(165, 136, 58, 0.42)',
    preview: ['#d8c5a2', '#82634e']
  },
  {
    id: 'tournament',
    name: 'Tournament Blue',
    lightSquare: '#e0e0e0',
    darkSquare: '#6082b6',
    highlightLight: '#aecf72',
    highlightDark: '#7fb83d',
    lastMoveLight: 'rgba(174, 207, 114, 0.42)',
    lastMoveDark: 'rgba(127, 184, 61, 0.42)',
    preview: ['#e0e0e0', '#6082b6']
  },
  {
    id: 'midnight',
    name: 'Midnight',
    lightSquare: '#c8c8c8',
    darkSquare: '#4a4a4a',
    highlightLight: '#a8a845',
    highlightDark: '#6d6d30',
    lastMoveLight: 'rgba(168, 168, 69, 0.35)',
    lastMoveDark: 'rgba(109, 109, 48, 0.35)',
    preview: ['#c8c8c8', '#4a4a4a']
  },
  {
    id: 'coral',
    name: 'Coral',
    lightSquare: '#f1ddc4',
    darkSquare: '#c37b5c',
    highlightLight: '#e6c96d',
    highlightDark: '#b8913a',
    lastMoveLight: 'rgba(230, 201, 109, 0.42)',
    lastMoveDark: 'rgba(184, 145, 58, 0.42)',
    preview: ['#f1ddc4', '#c37b5c']
  },
  {
    id: 'emerald',
    name: 'Emerald',
    lightSquare: '#dcedc8',
    darkSquare: '#558b2f',
    highlightLight: '#e6e650',
    highlightDark: '#9eb82e',
    lastMoveLight: 'rgba(230, 230, 80, 0.42)',
    lastMoveDark: 'rgba(158, 184, 46, 0.42)',
    preview: ['#dcedc8', '#558b2f']
  }
]

export const APP_THEMES: AppTheme[] = [
  {
    id: 'dark',
    name: 'Dark',
    bg: '#1a1a1d',
    bgSecondary: '#222226',
    bgPanel: '#27272c',
    bgElevated: '#303036',
    bgHover: '#35353c',
    border: '#3a3a42',
    borderSubtle: '#2e2e36',
    text: '#e8e6e3',
    textSecondary: '#9a9a9f',
    textMuted: '#636369',
    accent: '#81b64c',
    accentText: '#ffffff',
    evalBarWhite: '#e8e6e3',
    evalBarBlack: '#312e2b',
    evalBadgeBg: '#312e2b',
    evalBadgeText: '#e8e6e3'
  },
  {
    id: 'darker',
    name: 'OLED Black',
    bg: '#0c0c0e',
    bgSecondary: '#141418',
    bgPanel: '#1a1a1f',
    bgElevated: '#222228',
    bgHover: '#2a2a30',
    border: '#2a2a32',
    borderSubtle: '#1e1e26',
    text: '#d8d6d3',
    textSecondary: '#8a8a8f',
    textMuted: '#555559',
    accent: '#81b64c',
    accentText: '#ffffff',
    evalBarWhite: '#d8d6d3',
    evalBarBlack: '#1a1a1f',
    evalBadgeBg: '#1a1a1f',
    evalBadgeText: '#d8d6d3'
  },
  {
    id: 'light',
    name: 'Light',
    bg: '#f5f3f0',
    bgSecondary: '#eae8e5',
    bgPanel: '#ffffff',
    bgElevated: '#f0eeeb',
    bgHover: '#e5e3e0',
    border: '#d5d3d0',
    borderSubtle: '#e5e3e0',
    text: '#312e2b',
    textSecondary: '#6e6b68',
    textMuted: '#9a9895',
    accent: '#629924',
    accentText: '#ffffff',
    evalBarWhite: '#ffffff',
    evalBarBlack: '#312e2b',
    evalBadgeBg: '#ffffff',
    evalBadgeText: '#312e2b'
  }
]

const STORAGE_KEY_BOARD_THEME = 'chess_analyzer_board_theme'
const STORAGE_KEY_APP_THEME = 'chess_analyzer_app_theme'

interface ThemeContextType {
  boardTheme: BoardTheme
  setBoardTheme: (theme: BoardTheme) => void
  appTheme: AppTheme
  setAppTheme: (theme: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  boardTheme: BOARD_THEMES[0],
  setBoardTheme: () => {},
  appTheme: APP_THEMES[0],
  setAppTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [boardTheme, setBoardThemeState] = useState<BoardTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOARD_THEME)
      if (saved) {
        const found = BOARD_THEMES.find((t) => t.id === saved)
        if (found) return found
      }
    } catch {}
    return BOARD_THEMES[0]
  })

  const [appTheme, setAppThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_APP_THEME)
      if (saved) {
        const found = APP_THEMES.find((t) => t.id === saved)
        if (found) return found
      }
    } catch {}
    return APP_THEMES[0]
  })

  const setBoardTheme = (theme: BoardTheme) => {
    setBoardThemeState(theme)
    localStorage.setItem(STORAGE_KEY_BOARD_THEME, theme.id)
  }

  const setAppTheme = (theme: AppTheme) => {
    setAppThemeState(theme)
    localStorage.setItem(STORAGE_KEY_APP_THEME, theme.id)
  }

  // Apply CSS custom properties to root
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg', appTheme.bg)
    root.style.setProperty('--bg-secondary', appTheme.bgSecondary)
    root.style.setProperty('--bg-panel', appTheme.bgPanel)
    root.style.setProperty('--bg-elevated', appTheme.bgElevated)
    root.style.setProperty('--bg-hover', appTheme.bgHover)
    root.style.setProperty('--border', appTheme.border)
    root.style.setProperty('--border-subtle', appTheme.borderSubtle)
    root.style.setProperty('--text', appTheme.text)
    root.style.setProperty('--text-secondary', appTheme.textSecondary)
    root.style.setProperty('--text-muted', appTheme.textMuted)
    root.style.setProperty('--accent', appTheme.accent)
    root.style.setProperty('--accent-text', appTheme.accentText)
    document.body.style.backgroundColor = appTheme.bg
    document.body.style.color = appTheme.text
  }, [appTheme])

  return (
    <ThemeContext.Provider value={{ boardTheme, setBoardTheme, appTheme, setAppTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
