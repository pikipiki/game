import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { GameState } from '@/game/engine';
import { ArmyUnitCardView } from '@/app/components/creature/ArmyUnitCardView';
import { GameIcon } from '@/app/components/ui/GameIcon';
import { buildArmyUnitCardLabels } from '@/app/lib/army-unit-card-copy';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface ArmyModalViewProps {
  readonly state: GameState;
}

export function ArmyModalView({ state }: ArmyModalViewProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography className="modal-subtitle" component="p" variant="body2">
        {t('modals.army.subtitle')}
      </Typography>
      {state.army.map((unit) => {
        const labels = buildArmyUnitCardLabels(state, unit.id, t);
        if (!labels) return null;
        return (
          <ArmyUnitCardView
            key={unit.id}
            labels={labels}
            state={state}
            unitId={unit.id}
          />
        );
      })}
      <Box className="notice">
        <GameIcon name="spark" size={18} />
        {t('modals.army.notice')}
      </Box>
    </Box>
  );
}
