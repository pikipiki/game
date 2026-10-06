import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DownloadIcon from '@mui/icons-material/Download';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import UploadIcon from '@mui/icons-material/Upload';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import type { GameState } from '@/game/engine';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface SettingsModalViewProps {
  readonly state: GameState;
}

export function SettingsModalView({ state }: SettingsModalViewProps) {
  const { t, locale } = useTranslation();
  const troops = state.army.reduce((total, unit) => total + unit.count, 0);
  let frClass = 'button subtle full';
  let enClass = 'button subtle full';
  if (locale === 'fr') {
    frClass = 'button subtle full active';
  }
  if (locale === 'en') {
    enClass = 'button subtle full active';
  }

  return (
    <Box>
      <Typography className="modal-subtitle" component="p" variant="body2">
        {t('modals.settings.subtitle')}
      </Typography>
      <Typography className="section-label" component="p" variant="overline">
        {t('locale.label')}
      </Typography>
      <GameActionButton
        className={frClass}
        fullWidth
        gameAction="locale-fr"
        variant="outlined"
      >
        {t('locale.fr')}
      </GameActionButton>
      <GameActionButton
        className={enClass}
        fullWidth
        gameAction="locale-en"
        variant="outlined"
      >
        {t('locale.en')}
      </GameActionButton>
      <Box className="save-summary">
        <div>
          <strong>
            {t('modals.settings.summary', {
              day: state.day,
              castle: state.castle,
            })}
          </strong>
          <p>
            {t('modals.settings.stats', {
              cleared: state.cleared.length,
              troops,
            })}
          </p>
        </div>
      </Box>
      <GameActionButton
        fullWidth
        gameAction="export"
        startIcon={<DownloadIcon />}
        variant="crystal"
      >
        {t('modals.settings.export')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="import"
        startIcon={<UploadIcon />}
        variant="subtle"
      >
        {t('modals.settings.import')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="audio-settings"
        startIcon={<VolumeUpIcon />}
        variant="subtle"
      >
        {t('modals.settings.audio')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="help"
        startIcon={<HelpOutlineIcon />}
        variant="subtle"
      >
        {t('modals.settings.help')}
      </GameActionButton>
      <GameActionButton
        fullWidth
        gameAction="restart"
        variant="danger"
      >
        {t('modals.settings.restart')}
      </GameActionButton>
      <Typography className="fine-print" component="p" variant="caption">
        {t('modals.settings.finePrint')}
      </Typography>
    </Box>
  );
}
