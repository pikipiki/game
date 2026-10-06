import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { pomponTheme } from '@/app/theme/pomponTheme';

interface AppProvidersProps {
  readonly children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={pomponTheme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
