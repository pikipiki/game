import { AppToastView } from '@/app/components/feedback/AppToastView';
import { useGameRuntime } from '@/app/providers/GameContext';

export function ToastContainer() {
  const { toastMessage, toastOpen, toastDurationMs, dismissToast } =
    useGameRuntime();

  return (
    <AppToastView
      autoHideDuration={toastDurationMs}
      message={toastMessage}
      onClose={dismissToast}
      open={toastOpen}
    />
  );
}
