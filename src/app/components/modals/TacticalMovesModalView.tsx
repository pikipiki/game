import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { TacticalCellModel } from '@/app/types/combat-presentation';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface TacticalMovesModalViewProps {
  readonly cells: readonly TacticalCellModel[];
}

export function TacticalMovesModalView({
  cells,
}: TacticalMovesModalViewProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography component="p" variant="body2">
        {t('modals.tactical.intro')}
      </Typography>
      <Box
        aria-label={t('modals.tactical.gridAria')}
        className="tactical-grid"
        role="group"
      >
        {cells.map((cell) => (
          <GameActionButton
            key={`${cell.q},${cell.r}`}
            actionQ={cell.q}
            actionR={cell.r}
            disabled={!cell.allowed}
            gameAction="select-cell"
            variant="outlined"
          >
            {cell.label}
          </GameActionButton>
        ))}
      </Box>
    </Box>
  );
}
