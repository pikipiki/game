import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { useTranslation } from '@/app/hooks/useTranslation';

export function RestartModalView() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography component="p" variant="body2">
        {t('modals.restart.body')}
      </Typography>
      <GameActionButton
        fullWidth
        gameAction="confirm-restart"
        variant="danger"
      >
        {t('modals.restart.confirm')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="settings"
        variant="subtle"
      >
        {t('modals.restart.back')}
      </GameActionButton>
    </Box>
  );
}
