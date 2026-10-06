import { SITES, WALKABLE, key, pathTo } from './data';
import type { GameState, Hex, OpponentHero } from './types';

export type { OpponentHero } from './types';

export function initialOpponents(): OpponentHero[] {
  return [
    {
      id: 'enemy-dusk',
      name: 'Noisette des Brumes',
      q: 3,
      r: -3,
      army: [
        { id: 'enemy-0', creature: 'sylve', count: 4, xp: 0 },
        { id: 'enemy-1', creature: 'sol', count: 3, xp: 0 },
      ],
    },
    {
      id: 'enemy-dawn',
      name: 'Praline du Crépuscule',
      q: 3,
      r: 0,
      army: [
        { id: 'enemy-0', creature: 'sylve', count: 5, xp: 0 },
        { id: 'enemy-1', creature: 'sol', count: 3, xp: 0 },
      ],
    },
  ];
}

type RouteTarget = Hex & { priority: number };

function routeSortScore(
  entry: { target: RouteTarget; path: Hex[] },
  playerHero: Hex,
): number {
  const huntsPlayer =
    key(entry.target) === key(playerHero) && entry.path.length <= 2;
  if (huntsPlayer) {
    return entry.path.length - 3;
  }
  return entry.path.length + entry.target.priority;
}

/** Two steps per enemy hero. Prefer nearby strategic targets, then hunt the player. */
export function opponentRoute(state: GameState, hero: OpponentHero): Hex[] {
  const targets: RouteTarget[] = [
    ...SITES.filter(
      (site) =>
        ['gold', 'crystal'].includes(site.kind) &&
        !state.enemyOwned?.includes(site.id),
    ).map((site) => ({ ...site, priority: -1 })),
    ...SITES.filter(
      (site) => site.kind === 'castle' && state.owned.includes(site.id),
    ).map((site) => ({
      ...site,
      priority: -2,
    })),
    { ...state.hero, priority: 0 },
  ];
  const occupied = new Set(
    (state.enemyHeroes ?? [])
      .filter((enemy) => enemy.id !== hero.id)
      .map(key),
  );
  const ground = WALKABLE.filter((tile) => !occupied.has(key(tile)));
  const routes = targets
    .map((target) => ({ target, path: pathTo(hero, target, ground) }))
    .filter(
      (entry) =>
        entry.path.length || key(entry.target) === key(hero),
    )
    .sort(
      (left, right) =>
        routeSortScore(left, state.hero) - routeSortScore(right, state.hero),
    );
  return routes[0]?.path.slice(0, 2) ?? [];
}

export function battleTitle(state: GameState): string {
  const battle = state.battle;
  if (!battle) return '';
  if (battle.opponent?.town) {
    const townName =
      SITES.find((site) => site.id === battle.opponent!.town)?.name ??
      'votre château';
    return `Défense de ${townName}`;
  }
  if (battle.opponent) {
    const heroName =
      state.enemyHeroes?.find(
        (enemy) => enemy.id === battle.opponent!.hero,
      )?.name ?? 'l’adversaire';
    return `Attaque de ${heroName}`;
  }
  return SITES.find((site) => site.id === battle.site)?.name ?? 'Bataille';
}
