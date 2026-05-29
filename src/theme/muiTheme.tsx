import { createTheme, type Theme } from '@mui/material/styles'
 
const shared = {
  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontSize: '2.5rem',  fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem',    fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem',  fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontSize: '1.25rem', fontWeight: 700 },
    h5: { fontSize: '1.1rem',  fontWeight: 700 },
    h6: { fontSize: '1rem',    fontWeight: 700 },
    button: { textTransform: 'none' as const, fontWeight: 600, letterSpacing: '0' },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
  },
  shape: { borderRadius: 16 },
}
 
function buildComponents(theme: Theme) {
  const isDark = theme.palette.mode === 'dark'
  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollBehavior: 'smooth' },
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          minHeight: '100vh',
          fontFamily: '"Inter", "Roboto", sans-serif',
        },
        '::-webkit-scrollbar': { width: 8, height: 8 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: theme.palette.divider,
          borderRadius: 4,
          '&:hover': { background: theme.palette.text.disabled },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 600,
          textTransform: 'none' as const,
          transition: 'all 0.3s ease',
          fontSize: '0.95rem',
        },
        containedPrimary: {
          boxShadow: 'none',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          '&:hover': {
            boxShadow: `0 12px 24px ${theme.palette.primary.main}40`,
            transform: 'translateY(-2px)',
          },
        },
        outlinedPrimary: {
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          '&:hover': {
            borderColor: theme.palette.primary.light,
            backgroundColor: `${theme.palette.primary.main}10`,
          },
        },
        outlined: {
          borderColor: theme.palette.divider,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: `${theme.palette.primary.main}08`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 16,
          boxShadow: isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.6)'
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: isDark
              ? `0 8px 24px ${theme.palette.primary.main}30`
              : `0 8px 24px ${theme.palette.primary.main}15`,
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.6)'
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
          borderRadius: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: theme.palette.background.default,
            transition: 'all 0.3s ease',
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: theme.palette.text.secondary },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
            },
          },
          '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
          '& .MuiInputBase-input': {
            color: theme.palette.text.primary,
            fontSize: '0.95rem',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? '0 12px 32px rgba(0, 0, 0, 0.8)'
            : '0 12px 32px rgba(0, 0, 0, 0.15)',
          borderRadius: 12,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          fontSize: 14,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.primary.main,
          },
          '&.Mui-selected': {
            backgroundColor: `${theme.palette.primary.main}20`,
            color: theme.palette.primary.main,
            fontWeight: 600,
            '&:hover': { backgroundColor: `${theme.palette.primary.main}28` },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '6px 0',
          color: theme.palette.text.secondary,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: `${theme.palette.primary.main}20`,
            color: theme.palette.primary.main,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: `${theme.palette.primary.main}28`,
              color: theme.palette.primary.main,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.primary,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 12,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: `${theme.palette.primary.main}12`,
          transition: 'all 0.2s ease',
        },
        filled: {
          backgroundColor: `${theme.palette.primary.main}15`,
        },
        outlined: {
          borderColor: theme.palette.divider,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.secondary,
            fontWeight: 700,
            fontSize: '0.8rem',
            borderBottom: `1px solid ${theme.palette.divider}`,
            padding: '14px 16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
            borderLeft: `3px solid ${theme.palette.primary.main}`,
          },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
            fontSize: 14,
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.background.paper,
          borderRadius: 16,
          border: `1px solid ${theme.palette.divider}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          boxShadow: isDark
            ? '0 24px 56px rgba(0, 0, 0, 0.9)'
            : '0 24px 56px rgba(0, 0, 0, 0.2)',
          borderRadius: 20,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          fontWeight: 700,
          fontSize: '1.25rem',
          padding: '24px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
          gap: 12,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 700,
          fontSize: 15,
          color: theme.palette.text.secondary,
          transition: 'all 0.3s ease',
          '&.Mui-selected': { color: theme.palette.primary.main },
          '&:hover': { color: theme.palette.text.primary },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: theme.palette.primary.main,
          height: 3,
          borderRadius: 2,
          transition: 'all 0.3s ease',
        },
        root: {
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 56,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
          fontSize: '0.95rem',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark ? '#0a0a0a' : '#374151',
          color: '#fff',
          borderRadius: 8,
          fontSize: '0.8rem',
          padding: '8px 12px',
          fontWeight: 500,
          boxShadow: isDark
            ? '0 8px 24px rgba(0, 0, 0, 0.8)'
            : '0 8px 24px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: theme.palette.divider },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 6 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1rem',
          width: 44,
          height: 44,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: theme.palette.text.secondary,
          transition: 'all 0.2s ease',
          '&:hover': {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { color: theme.palette.text.primary },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { color: theme.palette.text.secondary },
      },
    },
    MuiStack: {
      defaultProps: {
        useFlexGap: true,
      },
    },
  }
}
 
// ── DARK THEME — true black ──────────────────────────────────────────────────
const darkBase = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary:   { main: '#4da6ff', light: '#7bbfff', dark: '#2b8fe8', contrastText: '#fff' },
    secondary: { main: '#e85d04', light: '#f97316', dark: '#c2410c' },
    success:   { main: '#22c55e', light: '#4ade80', dark: '#16a34a' },
    warning:   { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error:     { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    info:      { main: '#38bdf8', light: '#7dd3fc', dark: '#0284c7' },
    background: {
      default: '#000000',   // ← true black page background
      paper:   '#0a0a0a',   // ← near-black cards / sidebar / dialogs
    },
    text: {
      primary:  '#f0f0f0',
      secondary: '#6b7280',
      disabled:  '#374151',
    },
    divider: 'rgba(255, 255, 255, 0.06)',
    action: {
      hover:    'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(77, 166, 255, 0.10)',
      disabled: 'rgba(255, 255, 255, 0.02)',
    },
  },
})
export const darkTheme = createTheme(darkBase, { components: buildComponents(darkBase) })
 
// ── LIGHT THEME ──────────────────────────────────────────────────────────────
const lightBase = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8', contrastText: '#fff' },
    secondary: { main: '#0891b2', light: '#22d3ee', dark: '#0e7490' },
    success:   { main: '#16a34a', light: '#22c55e', dark: '#15803d' },
    warning:   { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
    error:     { main: '#dc2626', light: '#f43f5e', dark: '#b91c1c' },
    info:      { main: '#0284c7', light: '#38bdf8', dark: '#0369a1' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#6b7280', disabled: '#9ca3af' },
    divider: '#e5e7eb',
    action: { hover: 'rgba(0, 0, 0, 0.04)', selected: 'rgba(37, 99, 235, 0.08)' },
  },
})
export const lightTheme = createTheme(lightBase, { components: buildComponents(lightBase) })
 
export const createAppTheme = (mode: 'light' | 'dark') =>
  mode === 'dark' ? darkTheme : lightTheme