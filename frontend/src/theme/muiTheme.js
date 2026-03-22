import { createTheme } from '@mui/material/styles';

/**
 * GVP-IT Portal — MUI Theme
 * Aligned with CSS design tokens in index.css
 * Single source of color/typography truth across all MUI components.
 */
const muiTheme = createTheme({
  palette: {
    primary: {
      main:         '#6366f1',   // --color-primary
      light:        '#a5b4fc',   // --color-primary-muted
      dark:         '#4f46e5',   // --color-primary-hover
      contrastText: '#ffffff',
    },
    secondary: {
      main:         '#8b5cf6',   // --color-secondary
      contrastText: '#ffffff',
    },
    error: {
      main:  '#ef4444',
      light: '#fee2e2',
      dark:  '#dc2626',
    },
    warning: {
      main:  '#f59e0b',
      light: '#fef3c7',
    },
    success: {
      main:  '#10b981',
      light: '#d1fae5',
      dark:  '#059669',
    },
    info: {
      main:  '#3b82f6',
      light: '#dbeafe',
    },
    background: {
      default: 'rgba(10,15,26,1)',     // Pearl Frost bg
      paper:   'rgba(15,23,42,0.97)', // Pearl Frost surface
    },
    text: {
      primary:   'rgba(255,255,255,0.92)',  // --color-text-primary
      secondary: 'rgba(255,255,255,0.55)',  // --color-text-secondary
      disabled:  'rgba(255,255,255,0.30)',  // --color-text-muted
    },
    divider: 'rgba(255,255,255,0.10)',   // --color-border
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeightLight:   300,
    fontWeightRegular: 400,
    fontWeightMedium:  500,
    fontWeightBold:    700,

    h1: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h4: { fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.35 },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.005em' },

    subtitle1: { fontWeight: 500, letterSpacing: '-0.005em' },
    subtitle2: { fontWeight: 500 },

    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6, fontSize: '0.875rem' },

    button: {
      fontWeight:     500,
      textTransform: 'none',
      letterSpacing: '0',
      lineHeight:    1,
    },

    caption: { color: '#94a3b8' },
    overline: { fontWeight: 600, letterSpacing: '0.08em' },
  },

  shape: {
    borderRadius: 8,   // --radius-md
  },

  // Minimal shadow scale (matches --shadow-* tokens)
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
    '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
    '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '0 25px 50px -12px rgb(0 0 0 / 0.15)',
  ],

  components: {
    /* ---- Buttons ---- */
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius:  '8px',
          padding:       '10px 20px',
          fontWeight:    500,
          fontSize:      '0.875rem',
          transition:    'background 150ms ease, box-shadow 150ms ease, transform 150ms ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.12)' },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.18)',
          '&:hover':   { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.12)' },
        },
      },
    },

    /* ---- Cards & Papers ---- */
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius:  '12px',
          border:        '1px solid rgba(255,255,255,0.12)',
          boxShadow:     '0 1px 3px 0 rgba(0,0,0,0.30)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: '12px',
        },
      },
    },

    /* ---- Text Fields ---- */
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius:    '8px',
          backgroundColor: 'rgba(71,85,105,0.20)',
          color:           'rgba(255,255,255,0.92)',
          transition:      'box-shadow 150ms ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.18)',
            transition: 'border-color 150ms ease',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366f1',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgb(99 102 241 / 0.12)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366f1',
            borderWidth: '1px',
          },
        },
        input: {
          padding:    '10px 14px',
          fontSize:   '0.875rem',
          lineHeight: '1.5',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color:    'rgba(255,255,255,0.55)',
          '&.Mui-focused': { color: '#818cf8' },
        },
      },
    },

    /* ---- Chips ---- */
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight:   500,
          fontSize:     '0.75rem',
        },
      },
    },

    /* ---- Avatar ---- */
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize:   '0.875rem',
        },
      },
    },

    /* ---- Dialog ---- */
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius:    '16px',
          boxShadow:       '0 25px 50px -12px rgba(0,0,0,0.60)',
          border:          '1px solid rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(10,15,26,0.97)',
          color:           'rgba(255,255,255,0.92)',
        },
      },
    },

    /* ---- Tabs ---- */
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight:    500,
          fontSize:      '0.875rem',
          minHeight:     '44px',
          '&.Mui-selected': { fontWeight: 600 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: '2px', borderRadius: '2px 2px 0 0' },
      },
    },

    /* ---- Table ---- */
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(71,85,105,0.22)',
            fontWeight:      600,
            fontSize:        '0.8125rem',
            color:           'rgba(255,255,255,0.65)',
            letterSpacing:   '0.03em',
            textTransform:   'uppercase',
            borderBottom:    '1px solid rgba(255,255,255,0.10)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize:     '0.875rem',
          padding:      '12px 16px',
          color:        'rgba(255,255,255,0.88)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(148,163,184,0.06)' },
          transition: 'background 120ms ease',
        },
      },
    },

    /* ---- Tooltip ---- */
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          borderRadius:    '6px',
          fontSize:        '0.75rem',
          padding:         '6px 10px',
        },
      },
    },

    /* ---- Divider ---- */
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.10)' },
      },
    },

    /* ---- AppBar ---- */
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow:       '0 1px 0 0 rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(10,15,26,0.92)',
          color:           'rgba(255,255,255,0.92)',
        },
      },
    },

    /* ---- Alert ---- */
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '8px', fontSize: '0.875rem' },
      },
    },

    /* ---- LinearProgress ---- */
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: '9999px', height: '6px' },
        bar:  { borderRadius: '9999px' },
      },
    },
  },
});

export default muiTheme;
