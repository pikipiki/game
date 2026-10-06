import { AppToastView } from '@/app/components/feedback/AppToastView';
import { useGameRuntime } from '@/app/providers/GameContext';

export function ToastContainer() {
  const { toastMessage, toastOpen, dismissToast } = useGameRuntime();

  return (
    <AppToastView
      message={toastMessage}
      onClose={dismissToast}
      open={toastOpen}
    />
  );
}
