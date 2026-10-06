import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DiamondIcon from '@mui/icons-material/Diamond';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

export interface ResourceBarViewProps {
  readonly gold: string;
  readonly crystals: string;
  readonly mana: string;
}

export function ResourceBarView({
  gold,
  crystals,
  mana,
}: ResourceBarViewProps) {
  return (
    <Stack
      className="resources"
      direction="row"
      id="resources"
      spacing={0.5}
      useFlexGap
    >
      <Chip
        className="resource gold-text"
        icon={<MonetizationOnIcon fontSize="small" />}
        label={gold}
        size="small"
        title="Or"
        variant="outlined"
      />
      <Chip
        className="resource purple-text"
        icon={<DiamondIcon fontSize="small" />}
        label={crystals}
        size="small"
        title="Cristaux"
        variant="outlined"
      />
      <Chip
        className="resource mint-text"
        icon={<AutoAwesomeIcon fontSize="small" />}
        label={mana}
        size="small"
        title="Mana"
        variant="outlined"
      />
    </Stack>
  );
}
