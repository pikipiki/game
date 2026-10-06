import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import { getCreature } from '@/game/data';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { useTranslation } from '@/app/hooks/useTranslation';

export function IntroModalView() {
  const { t } = useTranslation();
  const sylve = getCreature('sylve');
  const sol = getCreature('sol');

  return (
    <Box className="intro-modal-body">
      <Box className="intro-art">
        <CreaturePortrait creature={sylve} />
        <span>✦</span>
        <CreaturePortrait creature={sol} />
      </Box>
      <Typography
        className="eyebrow centered"
        component="span"
        variant="overline"
      >
        {t('modals.intro.welcome')}
      </Typography>
      <Typography className="intro-title" component="h2" variant="h5">
        {t('modals.intro.headline')}
      </Typography>
      <Typography className="intro-copy" component="p" variant="body1">
        {t('modals.intro.copy')}
      </Typography>
      <Box className="intro-features">
        <span>
          <MapIcon fontSize="small" />
          {' '}
          {t('modals.intro.featExplore')}
        </span>
        <span>
          <SportsMmaIcon fontSize="small" />
          {' '}
          {t('modals.intro.featTurn')}
        </span>
        <span>
          <AutoAwesomeIcon fontSize="small" />
          {' '}
          {t('modals.intro.featEvolve')}
        </span>
      </Box>
      <GameActionButton
        data-testid="intro-enter"
        endIcon={<ArrowForwardIcon />}
        fullWidth
        gameAction="close"
        size="large"
        variant="gold"
      >
        {t('modals.intro.enter')}
      </GameActionButton>
      <Typography
        className="fine-print centered"
        component="p"
        variant="caption"
      >
        {t('modals.intro.finePrint')}
      </Typography>
    </Box>
  );
}
