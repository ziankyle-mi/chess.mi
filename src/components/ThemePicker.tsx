import { useState } from 'react'
import { useTheme, BOARD_THEMES, APP_THEMES } from '../lib/ThemeContext'
import { Palette, Check, Monitor, Moon, Sun } from 'lucide-react'

export const ThemePicker: React.FC = () => {
  const { boardTheme, setBoardTheme, appTheme, setAppTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const appThemeIcons: Record<string, React.ReactNode> = {
    dark: <Moon className="w-3.5 h-3.5" />,
    darker: <Monitor className="w-3.5 h-3.5" />,
    light: <Sun className="w-3.5 h-3.5" />
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all"
        style={{
          background: isOpen ? 'var(--bg-elevated)' : 'transparent',
          color: 'var(--text-secondary)',
          border: 'none'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
        onMouseLeave={(e) => { if (!isOpen) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}}
        title="Board & App Theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-lg shadow-xl p-4 w-[280px]"
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
            }}
          >
            {/* Board Themes */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2.5" style={{ color: 'var(--text-muted)' }}>
                Board
              </span>
              <div className="grid grid-cols-4 gap-2">
                {BOARD_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setBoardTheme(theme)}
                    className="relative flex flex-col items-center gap-1 group"
                    title={theme.name}
                  >
                    <div
                      className="w-full aspect-square rounded-md overflow-hidden grid grid-cols-2 grid-rows-2 transition-transform group-hover:scale-105"
                      style={{
                        outline: boardTheme.id === theme.id ? `2px solid var(--accent)` : '1px solid var(--border)',
                        outlineOffset: boardTheme.id === theme.id ? '1px' : '0'
                      }}
                    >
                      <div style={{ backgroundColor: theme.preview[0] }} />
                      <div style={{ backgroundColor: theme.preview[1] }} />
                      <div style={{ backgroundColor: theme.preview[1] }} />
                      <div style={{ backgroundColor: theme.preview[0] }} />
                    </div>
                    {boardTheme.id === theme.id && (
                      <div className="absolute -top-1 -right-1 rounded-full p-0.5" style={{ background: 'var(--accent)' }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <span className="text-[10px] truncate w-full text-center" style={{ color: 'var(--text-muted)' }}>
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* App Themes */}
            <div className="pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Interface
              </span>
              <div className="flex gap-2">
                {APP_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setAppTheme(theme)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: appTheme.id === theme.id ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: appTheme.id === theme.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                      border: appTheme.id === theme.id ? 'none' : '1px solid var(--border-subtle)'
                    }}
                  >
                    {appThemeIcons[theme.id]}
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
