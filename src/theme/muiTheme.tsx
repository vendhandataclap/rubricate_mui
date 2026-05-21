import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode
            primary: {
              main: '#0066ff',
              light: '#3b82f6',
              dark: '#0044aa',
            },
            secondary: {
              main: '#2563eb',
            },
            success: {
              main: '#16a34a',
              light: '#22c55e',
            },
            warning: {
              main: '#ea580c',
              light: '#fb923c',
            },
            error: {
              main: '#dc2626',
              light: '#f87171',
            },
            info: {
              main: '#2563eb',
              light: '#60a5fa',
            },
            background: {
              default: '#f8fafc',
              paper: '#ffffff',
            },
            text: {
              primary: '#1e293b',
              secondary: '#64748b',
              disabled: '#94a3b8',
            },
            divider: '#e2e8f0',
          }
        : {
            // Dark mode
            primary: {
              main: '#3b82f6',
              light: '#60a5fa',
              dark: '#2563eb',
            },
            secondary: {
              main: '#60a5fa',
            },
            success: {
              main: '#22c55e',
              light: '#16a34a',
            },
            warning: {
              main: '#fb923c',
              light: '#f59e0b',
            },
            error: {
              main: '#f87171',
              light: '#ef4444',
            },
            info: {
              main: '#60a5fa',
            },
            background: {
              default: '#0b1120',
              paper: '#111827',
            },
            text: {
              primary: '#f1f5f9',
              secondary: '#94a3b8',
              disabled: '#64748b',
            },
            divider: '#1e293b',
          }),
    },
    typography: {
      fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: '2rem',
        fontWeight: 700,
      },
      h2: {
        fontSize: '1.75rem',
        fontWeight: 700,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({
            ownerState,
          }: {
            ownerState: { variant?: string; color?: string }
          }) => ({
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '10px 16px',
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'primary' && {
                '&:hover': { backgroundColor: '#0052cc' },
              }),
          }),
          sizeLarge: {
            padding: '12px 24px',
            fontSize: '1rem',
          },
          sizeSmall: {
            padding: '6px 12px',
            fontSize: '0.875rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          root: {
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 0',
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 102, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(0, 102, 255, 0.15)',
              },
            },
          },
        },
      },
    },
  })
}

export function AppThemeProvider({ children, mode }: { children: React.ReactNode; mode: 'light' | 'dark' }) {
  const theme = createAppTheme(mode)
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
