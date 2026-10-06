import '@mui/material/Button';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    gold: true;
    subtle: true;
    danger: true;
    crystal: true;
  }
}
