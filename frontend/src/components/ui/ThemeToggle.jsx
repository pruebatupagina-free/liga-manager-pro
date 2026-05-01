import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? 'Cambiar a modo noche' : 'Cambiar a modo día'}
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '1.25rem',
        zIndex: 9999,
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'var(--color-secondary)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-fg-muted)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        transition: 'background 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {isLight ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  )
}
