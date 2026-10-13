import { createTheme } from '@mui/material/styles';

// MUI needs concrete colors (it computes contrast/alpha), so the palette mirrors
// the CSS tokens in style/global.css for each mode.
const palettes = {
  light: {
    primary: { main: '#2e6b30', dark: '#1b3a26', light: '#4f8f45', contrastText: '#ffffff' },
    secondary: { main: '#b4491a', contrastText: '#ffffff' },
    error: { main: '#b42318' },
    warning: { main: '#b4491a' },
    success: { main: '#1f7a3a' },
    background: { default: '#f7f6f1', paper: '#ffffff' },
    text: { primary: '#16261c', secondary: '#4b5a50' },
    divider: 'rgba(22, 38, 28, 0.12)',
  },
  dark: {
    primary: { main: '#a3d977', dark: '#8bc34a', light: '#bde59a', contrastText: '#0e1a12' },
    secondary: { main: '#f08a55', contrastText: '#0e1a12' },
    error: { main: '#ff8a7a' },
    warning: { main: '#f08a55' },
    success: { main: '#8fd6a2' },
    background: { default: '#0f1912', paper: '#17251c' },
    text: { primary: '#eef2e8', secondary: '#b8c4b8' },
    divider: 'rgba(238, 242, 232, 0.12)',
  },
};

export function buildMuiTheme(mode = 'light') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: { mode, ...palettes[isDark ? 'dark' : 'light'] },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      h1: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, letterSpacing: '-0.015em' },
      h3: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 600 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
      overline: { fontWeight: 700, letterSpacing: '0.14em' },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 999, minHeight: 44, paddingInline: 20 },
          sizeSmall: { minHeight: 36, paddingInline: 14 },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: 2 } } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 20 } },
      },
      MuiMenu: {
        styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${palettes[isDark ? 'dark' : 'light'].divider}` } },
      },
      MuiTooltip: {
        styleOverrides: { tooltip: { fontSize: '0.8rem', fontWeight: 600, borderRadius: 8 } },
      },
      MuiOutlinedInput: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiTab: {
        styleOverrides: { root: { textTransform: 'none', fontWeight: 700, minHeight: 48 } },
      },
    },
  });
}
