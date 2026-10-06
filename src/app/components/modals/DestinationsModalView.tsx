import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DIRECTIONS, SITES, WALKABLE, key, pathTo } from '@/game/data';
import type { GameState } from '@/game/engine';
import { localizedSite } from '@/i18n/localize';
import { getCatalogValue } from '@/i18n/translate';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { GameIcon } from '@/app/components/ui/GameIcon';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useMemo } from 'react';

function destinationSiteIcon(site: (typeof SITES)[number]): string {
  if (site.kind === 'castle') return 'castle';
  if (site.difficulty) return 'sword';
  if (site.kind === 'crystal') return 'gem';
  return 'flag';
}

export interface DestinationsModalViewProps {
  readonly state: GameState;
}

export function DestinationsModalView({ state }: DestinationsModalViewProps) {
  const { t, locale } = useTranslation();
  const directionNames = useMemo(() => {
    const raw = getCatalogValue(locale, 'modals.destinations.directions');
    if (!Array.isArray(raw)) return [];
    return raw as string[];
  }, [locale]);

  function destinationSiteSubtitle(
    site: (typeof SITES)[number],
    known: boolean,
    path: ReturnType<typeof pathTo>,
  ): string {
    if (!known) return t('modals.destinations.revealHint');
    if (key(site) === key(state.hero)) return t('modals.destinations.here');
    if (state.cleared.includes(site.id)) {
      return t('modals.destinations.cleared', { steps: path.length });
    }
    if (state.owned.includes(site.id)) {
      return t('modals.destinations.owned', { steps: path.length });
    }
    return t('modals.destinations.explore', { steps: path.length });
  }

  return (
    <Box>
      <Typography className="modal-subtitle" component="p" variant="body2">
        {t('modals.destinations.subtitle')}
      </Typography>
      <Box className="section-label">
        <span>{t('modals.destinations.exploreLabel')}</span>
        <span>
          {t('modals.destinations.stepsAvailable', {
            count: state.movement,
          })}
        </span>
      </Box>
      <Box className="direction-grid">
        {DIRECTIONS.map((dir, index) => {
          const next = { q: state.hero.q + dir.q, r: state.hero.r + dir.r };
          const allowed =
            WALKABLE.some((tile) => key(tile) === key(next)) &&
            state.movement > 0 &&
            !state.battle &&
            !state.won;
          const label = directionNames[index] ?? String(index);
          return (
            <GameActionButton
              key={label}
              actionQ={next.q}
              actionR={next.r}
              disabled={!allowed}
              gameAction="step"
              variant="subtle"
            >
              <GameIcon name="foot" size={15} />
              {label}
            </GameActionButton>
          );
        })}
      </Box>
      <Box className="section-label">
        <span>{t('modals.destinations.placesLabel')}</span>
      </Box>
      {SITES.map((site) => {
        const known = state.explored.includes(key(site));
        const path = pathTo(state.hero, site, WALKABLE);
        let name = t('modals.destinations.unknownPlace');
        if (known) name = localizedSite(site, t).name;
        const subtitle = destinationSiteSubtitle(site, known, path);
        const siteIcon = destinationSiteIcon(site);
        return (
          <GameActionButton
            key={site.id}
            actionId={site.id}
            className="destination-row"
            disabled={!known || Boolean(state.battle)}
            gameAction="destination"
            variant="text"
          >
            <span className="destination-icon">
              <GameIcon name={siteIcon} />
            </span>
            <span>
              <strong>{name}</strong>
              <small>{subtitle}</small>
            </span>
            <GameIcon name="arrow" size={16} />
          </GameActionButton>
        );
      })}
    </Box>
  );
}
