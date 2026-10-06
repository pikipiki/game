import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface WebglErrorViewProps {
  readonly title: string;
  readonly body: string;
}

export function WebglErrorView({ title, body }: WebglErrorViewProps) {
  return (
    <Box className="webgl-error" role="alert">
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      <Typography component="p" variant="body2">
        {body}
      </Typography>
    </Box>
  );
}
