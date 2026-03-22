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
      default: '#f8fafc',   // --color-bg
      paper:   '#ffffff',   // --color-surface
    },
    text: {
      primary:   '#0f172a',   // --color-text-primary
      secondary: '#475569',   // --color-text-secondary
      disabled:  '#94a3b8',   // --color-text-muted
    },
    divider: '#e2e8f0',   // --color-border
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
          borderColor: '#e2e8f0',
          '&:hover':   { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
        },
      },
    },

    /* ---- Cards & Papers ---- */
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius:  '12px',
          border:        '1px solid #e2e8f0',
          boxShadow:     '0 1px 3px 0 rgb(0 0 0 / 0.07)',
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
          backgroundColor: '#ffffff',
          transition:      'box-shadow 150ms ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
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
          color:    '#475569',
          '&.Mui-focused': { color: '#6366f1' },
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
          borderRadius:  '16px',
          boxShadow:     '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          border:        '1px solid #e2e8f0',
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
            backgroundColor: '#f8fafc',
            fontWeight:      600,
            fontSize:        '0.8125rem',
            color:           '#475569',
            letterSpacing:   '0.03em',
            textTransform:   'uppercase',
            borderBottom:    '1px solid #e2e8f0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          fontSize:     '0.875rem',
          padding:      '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f8fafc' },
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
        root: { borderColor: '#e2e8f0' },
      },
    },

    /* ---- AppBar ---- */
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow:       '0 1px 0 0 #e2e8f0',
          backgroundColor: '#ffffff',
          color:           '#0f172a',
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
