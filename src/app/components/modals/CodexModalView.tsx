import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CREATURES } from '@/game/data';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import {
  codexEvolveLine,
  codexFamilyEyebrow,
  displayCreature,
} from '@/app/lib/creature-ui-copy';
import { useTranslation } from '@/app/hooks/useTranslation';

export function CodexModalView() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography className="modal-subtitle" component="p" variant="body2">
        {t('modals.codex.subtitle')}
      </Typography>
      <Box className="codex-grid">
        {Object.values(CREATURES).map((entry) => {
          const creature = displayCreature(entry.id, t);
          return (
            <article
              key={creature.id}
              className="codex-card"
              style={{ '--creature-color': creature.color } as object}
            >
              <CreaturePortrait creature={creature} />
              <span className="eyebrow">
                {codexFamilyEyebrow(creature, t)}
                {' '}
                ·
                {t('modals.codex.level')}
                {creature.tier}
              </span>
              <h3>{creature.name}</h3>
              <p>{creature.description}</p>
              <small>{codexEvolveLine(creature, t)}</small>
            </article>
          );
        })}
      </Box>
    </Box>
  );
}
