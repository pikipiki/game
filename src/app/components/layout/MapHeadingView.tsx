import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { MapHeadingCopy } from '@/app/lib/game-copy';

export interface MapHeadingViewProps {
  readonly copy: MapHeadingCopy;
}

export function MapHeadingView({ copy }: MapHeadingViewProps) {
  return (
    <Box className="map-heading" id="map-heading">
      <Box className="region-tag" component="div">
        <Box component="i" />
        {copy.regionTag}
      </Box>
      <Typography component="h1" variant="h5">
        {copy.title}
      </Typography>
      <Typography component="p" variant="body2">
        {copy.subtitle}
      </Typography>
    </Box>
  );
}
