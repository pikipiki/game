import Box from '@mui/material/Box';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';

export interface MapCaptionViewProps {
  readonly inBattle: boolean;
  readonly movementLabel?: string;
  readonly allyLegend: string;
  readonly enemyLegend: string;
  readonly dragTipPan: string;
  readonly dragTipEnemies: string;
}

export function MapCaptionView({
  inBattle,
  movementLabel,
  allyLegend,
  enemyLegend,
  dragTipPan,
  dragTipEnemies,
}: MapCaptionViewProps) {
  if (inBattle) {
    return (
      <Box className="map-caption map-caption--battle" id="map-caption">
        <span className="legend-dot ally" />
        {' '}
        {allyLegend}
        {' '}
        <span className="legend-dot enemy" />
        {' '}
        {enemyLegend}
      </Box>
    );
  }
  return (
    <Box className="map-caption map-caption--explore" id="map-caption">
      <Box className="map-caption__movement" component="p">
        <DirectionsWalkIcon sx={{ fontSize: 15 }} aria-hidden />
        <span>{movementLabel}</span>
      </Box>
      <p className="map-caption__hint">
        <span>{dragTipPan}</span>
        <span className="map-caption__hint-line">{dragTipEnemies}</span>
      </p>
    </Box>
  );
}
