import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export interface AppToastViewProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export function AppToastView({ open, message, onClose }: AppToastViewProps) {
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={3500}
      className="toast"
      id="toast"
      onClose={onClose}
      open={open}
    >
      <Alert
        aria-live="polite"
        className="toast"
        onClose={onClose}
        role="status"
        severity="info"
        variant="filled"
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
