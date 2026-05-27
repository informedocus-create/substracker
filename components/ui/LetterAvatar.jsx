'use client'

/**
 * LetterAvatar — shows the first letter of a service name
 * inside a colored circle. Zero copyright risk, instant load.
 *
 * Props:
 *   name   — service name (e.g. "Netflix")
 *   color  — brand color string (e.g. "#E50914")
 *   size   — diameter in px (default 36)
 *   radius — border-radius in px (default 10)
 */
export default function LetterAvatar({ name = '?', color = '#888', size = 36, radius = 10 }) {
  const letter = String(name).trim()[0]?.toUpperCase() ?? '?'

  // Decide text color: white for dark backgrounds, dark for light ones
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  // Relative luminance — W3C formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const textColor = luminance > 0.55 ? 'rgba(0,0,0,0.75)' : '#ffffff'

  return (
    <div
      aria-label={name}
      style={{
        width:           size,
        height:          size,
        borderRadius:    radius,
        background:      color,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        color:           textColor,
        fontSize:        Math.round(size * 0.46),
        fontWeight:      700,
        fontFamily:      'system-ui, sans-serif',
        letterSpacing:   '-0.01em',
        userSelect:      'none',
      }}
    >
      {letter}
    </div>
  )
}
