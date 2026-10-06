import Box from '@mui/material/Box';
import type { GameState } from '@/game/engine';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { GameIcon } from '@/app/components/ui/GameIcon';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface VictoryModalViewProps {
  readonly state: GameState;
}

export function VictoryModalView({ state }: VictoryModalViewProps) {
  const { t } = useTranslation();
  const troops = state.army.reduce((total, unit) => total + unit.count, 0);

  return (
    <Box>
      <Box className="victory-art">
        <GameIcon name="flag" size={64} />
      </Box>
      <span className="eyebrow centered">
        {t('modals.victory.tag', { day: state.day })}
      </span>
      <h2 className="intro-title">{t('modals.victory.headline')}</h2>
      <p className="intro-copy">
        {t('modals.victory.copy', { troops })}
      </p>
      <GameActionButton
        fullWidth
        gameAction="export"
        variant="gold"
      >
        <GameIcon name="download" />
        {t('modals.victory.export')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="restart"
        variant="subtle"
      >
        {t('modals.victory.restart')}
      </GameActionButton>
    </Box>
  );
}
