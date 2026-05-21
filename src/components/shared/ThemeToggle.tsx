/**
 * ThemeToggle — cycles through light → dark → system themes.
 */
import { Sun, Moon, Monitor } from 'lucide-react'
import { IconButton, Button, useTheme as useMuiTheme, Tooltip } from '@mui/material'
import { useTheme, type Theme } from './ThemeProvider'

const themeOrder: Theme[] = ['light', 'dark', 'system']
const icons = { light: Sun, dark: Moon, system: Monitor }
const labels = { light: 'Light', dark: 'Dark', system: 'System' }

export default function ThemeToggle({ iconOnly = false }: { iconOnly?: boolean }) {
  const { theme, setTheme } = useTheme()
  const muiTheme = useMuiTheme()

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme)
    const next = themeOrder[(idx + 1) % themeOrder.length]
    setTheme(next)
  }

  const Icon = icons[theme]

  if (iconOnly) {
    return (
      <Tooltip title={`Theme: ${labels[theme]}`}>
        <IconButton
          size="small"
          onClick={cycleTheme}
          sx={{
            color: muiTheme.palette.text.secondary,
            '&:hover': {
              color: muiTheme.palette.text.primary,
            },
          }}
        >
          <Icon size={18} />
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button
      startIcon={<Icon size={16} />}
      onClick={cycleTheme}
      variant="text"
      size="small"
      sx={{
        textTransform: 'none',
        fontSize: '0.875rem',
      }}
      title={`Theme: ${labels[theme]}`}
    >
      {labels[theme]}
    </Button>
  )
}
