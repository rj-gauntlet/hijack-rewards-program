import { createTheme } from '@mui/material/styles';

const HIJACK_ORANGE = '#ff6b35';
const HIJACK_ORANGE_DARK = '#e85d04';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: HIJACK_ORANGE },
    secondary: { main: HIJACK_ORANGE_DARK },
    background: {
      default: '#000000',
      paper: '#0a0a0a',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: {
    fontFamily: '"DM Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h5: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
    h6: { fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${HIJACK_ORANGE}, ${HIJACK_ORANGE_DARK})`,
          color: '#000000',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          '&:hover': {
            background: `linear-gradient(135deg, ${HIJACK_ORANGE}, ${HIJACK_ORANGE_DARK})`,
            filter: 'brightness(1.1)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          '&:hover': {
            borderColor: HIJACK_ORANGE,
            backgroundColor: 'rgba(255, 107, 53, 0.2)',
            color: HIJACK_ORANGE,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: 'rgba(255, 107, 53, 0.25)',
          color: HIJACK_ORANGE,
          border: '1px solid rgba(255, 107, 53, 0.4)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        bar: {
          borderRadius: 6,
        },
        root: {
          borderRadius: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});
