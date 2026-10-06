import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { GameState } from '@/game/engine';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface RetreatModalViewProps {
  readonly state: GameState;
  readonly trainingBackup: GameState | null;
}

export function RetreatModalView({
  state,
  trainingBackup,
}: RetreatModalViewProps) {
  const { t } = useTranslation();

  if (trainingBackup) {
    return (
      <Box>
        <Typography component="p" variant="body2">
          {t('modals.retreat.trainingBody')}
        </Typography>
        <GameActionButton
          fullWidth
          gameAction="confirm-retreat"
          variant="gold"
        >
          {t('modals.retreat.trainingConfirm')}
        </GameActionButton>
        <GameActionButton
          fullWidth
          gameAction="close"
          variant="subtle"
        >
          {t('modals.retreat.trainingCancel')}
        </GameActionButton>
      </Box>
    );
  }

  if (state.battle?.opponent?.armyBackup) {
    return (
      <Box>
        <Typography component="p" variant="body2">
          {t('modals.retreat.castleBody')}
        </Typography>
        <GameActionButton
          fullWidth
          gameAction="confirm-retreat"
          variant="danger"
        >
          {t('modals.retreat.castleConfirm')}
        </GameActionButton>
        <GameActionButton
          fullWidth
          gameAction="close"
          variant="subtle"
        >
          {t('modals.retreat.castleCancel')}
        </GameActionButton>
      </Box>
    );
  }

  let lead = '';
  if (state.battle?.opponent?.town) {
    lead = t('modals.retreat.defaultLead');
  }

  return (
    <Box>
      <Typography component="p" variant="body2">
        {lead}
        {t('modals.retreat.defaultBody')}
      </Typography>
      <GameActionButton
        fullWidth
        gameAction="confirm-retreat"
        variant="danger"
      >
        {t('modals.retreat.defaultConfirm')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="close"
        variant="subtle"
      >
        {t('modals.retreat.defaultCancel')}
      </GameActionButton>
    </Box>
  );
}
