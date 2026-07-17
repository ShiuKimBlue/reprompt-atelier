import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Lightbulb } from 'lucide-react'

export function BulbToggle() {
  const { darkMode, toggleDarkMode } = useSettingsStore()
  const [flashing, setFlashing] = useState(false)
  const [rippling, setRippling] = useState(false)

  const handleToggle = useCallback(() => {
    toggleDarkMode()

    setFlashing(true)
    setTimeout(() => setFlashing(false), 500)

    setRippling(true)
    setTimeout(() => setRippling(false), 600)
  }, [toggleDarkMode])

  const isOn = !darkMode

  return (
    <div className="absolute top-[10px] right-[10px] z-50">
      <button
        onClick={handleToggle}
        role="switch"
        aria-checked={isOn}
        aria-label={isOn ? '切换到深色模式' : '切换到浅色模式'}
        className={`
          relative w-9 h-9 rounded-lg border cursor-pointer
          flex items-center justify-center
          transition-all duration-300 ease-out
          outline-none
          ${flashing ? 'bulb-flash' : ''}
          ${isOn
            ? 'bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.22)] bulb-glow-on'
            : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)]'
          }
        `}
        style={isOn ? {
          boxShadow: '0 0 16px rgba(251,191,36,0.12), 0 0 32px rgba(251,191,36,0.06), inset 0 0 8px rgba(251,191,36,0.08)',
        } : undefined}
        title={isOn ? '关灯（深色模式）' : '开灯（浅色模式）'}
      >
        <Lightbulb
          className={`
            w-[18px] h-[18px] transition-all duration-400
            ${isOn
              ? 'text-[#FBBF24] drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
              : 'text-[#6b7280]'
            }
          `}
          strokeWidth={1.8}
          fill={isOn ? 'currentColor' : 'none'}
        />
        {rippling && <div className="bulb-ripple-effect" />}
      </button>
    </div>
  )
}
