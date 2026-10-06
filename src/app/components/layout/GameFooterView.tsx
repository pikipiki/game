import Box from '@mui/material/Box';
import BookIcon from '@mui/icons-material/Book';
import CastleIcon from '@mui/icons-material/Castle';
import MapIcon from '@mui/icons-material/Map';
import ShieldIcon from '@mui/icons-material/Shield';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpIcon from '@mui/icons-material/Help';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import type { FooterShellLabels } from '@/app/lib/game-copy';

export interface GameFooterViewProps {
  readonly labels: FooterShellLabels;
  readonly endDayDisabled: boolean;
  readonly saveStatus: string;
  readonly saveUnsaved: boolean;
}

export function GameFooterView({
  labels,
  endDayDisabled,
  saveStatus,
  saveUnsaved,
}: GameFooterViewProps) {
  let saveClass = '';
  if (saveUnsaved) saveClass = 'unsaved';

  return (
    <Box className="footer" component="footer">
      <nav aria-label={labels.navAria}>
        <GameActionButton
          gameAction="map"
          className="nav-btn active"
          startIcon={<MapIcon />}
          variant="text"
        >
          {labels.explore}
        </GameActionButton>
        <GameActionButton
          gameAction="army"
          className="nav-btn"
          startIcon={<ShieldIcon />}
          variant="text"
        >
          {labels.army}
        </GameActionButton>
        <GameActionButton
          gameAction="castle"
          className="nav-btn"
          startIcon={<CastleIcon />}
          variant="text"
        >
          {labels.castle}
        </GameActionButton>
        <GameActionButton
          gameAction="codex"
          className="nav-btn"
          startIcon={<BookIcon />}
          variant="text"
        >
          {labels.codex}
        </GameActionButton>
      </nav>
      <Box className="save-indicator" id="save-indicator">
        <Box className={saveClass} component="i" />
        {saveStatus}
        <GameActionButton
          gameAction="help"
          aria-label={labels.helpAria}
          className="text-button"
          size="small"
          variant="text"
        >
          <HelpIcon fontSize="small" />
        </GameActionButton>
      </Box>
      <GameActionButton
        gameAction="end-day"
        className="end-day"
        disabled={endDayDisabled}
        endIcon={<ArrowForwardIcon />}
        id="end-day"
        startIcon={<WbSunnyIcon />}
        variant="gold"
      >
        {labels.endDay}
      </GameActionButton>
    </Box>
  );
}
