import { createTheme } from '@mui/material/styles';

const goldBg = '#dec08a';
const goldText = '#30291c';
const subtleBg = '#1a2118';
const subtleBorder = '#ffffff28';
const crystalBg = '#9cc9c4';
const crystalText = '#1a2e2c';
const dangerBg = '#c68b93';
const dangerText = '#29171d';

/** Thème MUI aligné sur les tokens du jeu (CSS legacy conservé pour la mise en page). */
export const pomponTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: goldBg,
      contrastText: goldText,
    },
    secondary: {
      main: '#7d9a6a',
    },
    background: {
      default: '#1a2118',
      paper: '#272c1e',
    },
    error: {
      main: dangerBg,
    },
  },
  typography: {
    fontFamily: '"Georgia", "Times New Roman", serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#1a2118' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 40,
          fontSize: 12,
          padding: '10px 14px',
          gap: 8,
        },
        sizeLarge: {
          minHeight: 51,
          fontSize: 14,
        },
      },
      variants: [
        {
          props: { variant: 'gold' },
          style: {
            backgroundColor: goldBg,
            color: goldText,
            '&:hover': { backgroundColor: goldBg, filter: 'brightness(1.1)' },
          },
        },
        {
          props: { variant: 'subtle' },
          style: {
            backgroundColor: subtleBg,
            color: '#f2f7f0',
            border: `1px solid ${subtleBorder}`,
            '&:hover': {
              backgroundColor: subtleBg,
              filter: 'brightness(1.1)',
            },
          },
        },
        {
          props: { variant: 'danger' },
          style: {
            backgroundColor: dangerBg,
            color: dangerText,
            '&:hover': {
              backgroundColor: dangerBg,
              filter: 'brightness(1.1)',
            },
          },
        },
        {
          props: { variant: 'crystal' },
          style: {
            backgroundColor: crystalBg,
            color: crystalText,
            '&:hover': {
              backgroundColor: crystalBg,
              filter: 'brightness(1.1)',
            },
          },
        },
      ],
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: '2px ridge #9d8551',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
  },
});
