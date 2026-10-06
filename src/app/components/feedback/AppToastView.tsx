import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export interface AppToastViewProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
  readonly autoHideDuration?: number;
}

export function AppToastView({
  open,
  message,
  onClose,
  autoHideDuration = 3500,
}: AppToastViewProps) {
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={autoHideDuration}
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
