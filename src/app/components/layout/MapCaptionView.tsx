import Box from '@mui/material/Box';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';

export interface MapCaptionViewProps {
  readonly inBattle: boolean;
  readonly movementLabel?: string;
  readonly allyLegend: string;
  readonly enemyLegend: string;
  readonly dragTip: string;
}

export function MapCaptionView({
  inBattle,
  movementLabel,
  allyLegend,
  enemyLegend,
  dragTip,
}: MapCaptionViewProps) {
  if (inBattle) {
    return (
      <Box className="map-caption" id="map-caption">
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
    <Box className="map-caption" id="map-caption">
      <DirectionsWalkIcon sx={{ fontSize: 15, verticalAlign: 'middle' }} />
      <span>{movementLabel}</span>
      <span className="caption-divider">·</span>
      <span className="drag-tip">{dragTip}</span>
    </Box>
  );
}
