import type { LocationCardModel } from '@/app/types/location-card';
import { localizedSite } from '@/i18n/localize';
import type { TranslateFn } from '@/i18n/translate';
import {
  getCreature,
  SITES,
  WALKABLE,
  worldTileAt,
  key,
  pathTo,
  type Hex,
} from '@/game/data';
import { income, type GameState } from '@/game/engine';

function siteLocationIcon(site: (typeof SITES)[number] | undefined): string {
  if (site?.kind === 'castle') return 'castle';
  if (site?.difficulty) return 'sword';
  return 'flag';
}

function locationEyebrow(
  site: (typeof SITES)[number] | undefined,
  cleared: boolean,
  atHero: boolean,
  t: TranslateFn,
): string {
  if (site?.kind === 'army' && !cleared) return t('location.eyebrowEnemyArmy');
  if (site?.kind === 'castle' && site.difficulty && !cleared) {
    return t('location.eyebrowEnemyCastle');
  }
  if (atHero) return t('location.eyebrowHere');
  return t('location.eyebrowDest');
}

function terrainTitle(target: Hex, t: TranslateFn): string {
  const tile = worldTileAt(target);
  if (tile?.terrain === 'forest') return t('location.forestTitle');
  return t('location.grassTitle');
}

function locationTitle(
  known: boolean,
  site: (typeof SITES)[number] | undefined,
  target: Hex,
  t: TranslateFn,
): string {
  if (!known) return t('location.unknownTitle');
  if (site) return localizedSite(site, t).name;
  return terrainTitle(target, t);
}

function locationDescription(
  known: boolean,
  site: (typeof SITES)[number] | undefined,
  t: TranslateFn,
): string {
  if (!known) return t('location.unknownDesc');
  if (site) return localizedSite(site, t).description;
  return t('location.defaultDesc');
}

function difficultyLabel(difficulty: number, t: TranslateFn): string {
  if (difficulty === 1) return t('location.difficultyEasy');
  if (difficulty === 2) return t('location.difficultyMid');
  return t('location.difficultyHard');
}

function fightButtonVariant(cleared: boolean): 'gold' | 'danger' {
  if (cleared) return 'gold';
  return 'danger';
}

function fightSiteStatusLabel(
  site: (typeof SITES)[number],
  cleared: boolean,
  t: TranslateFn,
): string {
  if (cleared) return t('location.cleared');
  return difficultyLabel(site.difficulty ?? 3, t);
}

function fightButtonLabelForSite(
  site: (typeof SITES)[number],
  cleared: boolean,
  locked: boolean,
  t: TranslateFn,
): string {
  if (cleared) return t('location.victoryBtn');
  if (locked) return t('location.sealed');
  if (site.kind === 'castle' || site.kind === 'fortress') {
    return t('location.siegeCastle');
  }
  return t('location.fight');
}

function buildAction(
  state: GameState,
  site: (typeof SITES)[number] | undefined,
  atHero: boolean,
  path: Hex[],
  possible: boolean,
  cleared: boolean,
  locked: boolean,
  t: TranslateFn,
): LocationCardModel['action'] {
  if (!atHero) {
    const steps = path.length || '—';
    return {
      kind: 'travel',
      steps,
      movement: state.movement,
      possible,
      stepsUnitLabel: t('location.stepsUnit'),
      moveButtonLabel: t('location.move'),
    };
  }
  const siegeTarget =
    site &&
    (site.difficulty ||
      (state.enemyOwned?.includes(site.id) && site.kind === 'castle')) &&
    !state.owned.includes(site.id);
  if (siegeTarget && site) {
    let statusLabel = fightSiteStatusLabel(site, cleared, t);
    if (locked) statusLabel = t('location.lockedBoss');
    return {
      kind: 'fight-site',
      siteId: site.id,
      cleared,
      locked,
      statusLabel,
      buttonVariant: fightButtonVariant(cleared),
      buttonLabel: fightButtonLabelForSite(site, cleared, locked, t),
    };
  }
  if (site?.kind === 'castle') {
    return {
      kind: 'castle',
      castleLevel: state.castle,
      dailyGold: income(state),
      costLine: t('location.castleLevel', {
        level: state.castle,
        gold: income(state),
      }),
      enterButtonLabel: t('location.enter'),
    };
  }
  let banner = t('location.bannerContinue');
  if (site && state.owned.includes(site.id)) {
    banner = t('location.bannerOwned');
  }
  return {
    kind: 'army',
    banner,
    viewArmyButtonLabel: t('location.viewArmy'),
  };
}

export function buildLocationCardModel(
  state: GameState,
  selected: Hex | null,
  t: TranslateFn,
): LocationCardModel {
  const target = selected ?? state.hero;
  const site = SITES.find((siteEntry) => key(siteEntry) === key(target));
  const atHero = key(target) === key(state.hero);
  const known = state.explored.includes(key(target));
  const path = pathTo(state.hero, target, WALKABLE);
  const possible = path.length > 0 && path.length <= state.movement && known;
  const enemyHero = state.enemyHeroes?.find(
    (enemy) => key(enemy) === key(target),
  );
  if (enemyHero && known) {
    const armyLine = enemyHero.army
      .map(
        (unit) => `${unit.count} ${getCreature(unit.creature).name}`,
      )
      .join(' · ');
    let buttonLabel = t('location.intercept');
    let gameAction: 'travel' | 'fight-hero' = 'travel';
    if (atHero) {
      buttonLabel = t('location.fightHero');
      gameAction = 'fight-hero';
    }
    return {
      eyebrow: t('location.eyebrowEnemyHero'),
      locIcon: 'flag',
      title: enemyHero.name,
      description: t('location.enemyHeroDesc'),
      action: {
        kind: 'enemy-hero',
        heroId: enemyHero.id,
        heroName: enemyHero.name,
        armyLine,
        atHero,
        possible,
        buttonLabel,
        gameAction,
      },
    };
  }
  const cleared = Boolean(site && state.cleared.includes(site.id));
  const locked =
    site?.id === 'boss' &&
    (!state.cleared.includes('camp1') || !state.cleared.includes('camp2'));
  return {
    eyebrow: locationEyebrow(site, cleared, atHero, t),
    locIcon: siteLocationIcon(site),
    title: locationTitle(known, site, target, t),
    description: locationDescription(known, site, t),
    action: buildAction(
      state,
      site,
      atHero,
      path,
      possible,
      cleared,
      locked,
      t,
    ),
  };
}
