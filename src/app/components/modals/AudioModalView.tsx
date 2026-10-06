import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface AudioModalViewProps {
  readonly muted: boolean;
  readonly musicVolume: number;
  readonly effectsVolume: number;
}

export function AudioModalView({
  muted,
  musicVolume,
  effectsVolume,
}: AudioModalViewProps) {
  const { t } = useTranslation();
  const musicPct = Math.round(musicVolume * 100);
  const effectsPct = Math.round(effectsVolume * 100);
  let toggleLabel = t('modals.audio.mute');
  if (muted) toggleLabel = t('modals.audio.unmute');

  return (
    <Box>
      <Typography component="p" variant="body2">
        {t('modals.audio.intro')}
      </Typography>
      <label className="audio-setting">
        {t('modals.audio.music')}
        <input
          aria-label={t('modals.audio.musicAria')}
          data-audio="music"
          max={100}
          min={0}
          type="range"
          value={musicPct}
        />
      </label>
      <label className="audio-setting">
        {t('modals.audio.effects')}
        <input
          aria-label={t('modals.audio.effectsAria')}
          data-audio="effects"
          max={100}
          min={0}
          type="range"
          value={effectsPct}
        />
      </label>
      <GameActionButton
        fullWidth
        gameAction="sound"
        variant="gold"
      >
        {toggleLabel}
      </GameActionButton>
    </Box>
  );
}
