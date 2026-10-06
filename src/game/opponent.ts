import { SITES, WALKABLE, key, pathTo, type Hex } from './data';
import type { GameState, Stack } from './engine';
export interface OpponentHero extends Hex {
  id: string;
  name: string;
  army: Stack[];
}
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
/** Two steps per enemy hero. Prefer nearby strategic targets, then hunt the player. */
export function opponentRoute(s: GameState, hero: OpponentHero): Hex[] {
  const targets = [
    ...SITES.filter(
      (p) => ['gold', 'crystal'].includes(p.kind) && !s.enemyOwned?.includes(p.id),
    ).map((p) => ({ ...p, priority: -1 })),
    ...SITES.filter((p) => p.kind === 'castle' && s.owned.includes(p.id)).map((p) => ({
      ...p,
      priority: -2,
    })),
    { ...s.hero, priority: 0 },
  ];
  const occupied = (s.enemyHeroes ?? []).filter((e) => e.id !== hero.id).map(key);
  const ground = WALKABLE.filter((t) => !occupied.includes(key(t)));
  const routes = targets
    .map((t) => ({ target: t, path: pathTo(hero, t, ground) }))
    .filter((p) => p.path.length || key(p.target) === key(hero))
    .sort(
      (a, b) =>
        a.path.length +
        (key(a.target) === key(s.hero) && a.path.length <= 2 ? -3 : a.target.priority) -
        (b.path.length +
          (key(b.target) === key(s.hero) && b.path.length <= 2 ? -3 : b.target.priority)),
    );
  return routes[0]?.path.slice(0, 2) ?? [];
}
export function battleTitle(s: GameState): string {
  const b = s.battle;
  if (!b) return '';
  if (b.opponent?.town)
    return `Défense de ${SITES.find((p) => p.id === b.opponent!.town)?.name ?? 'votre château'}`;
  if (b.opponent)
    return `Attaque de ${s.enemyHeroes?.find((h) => h.id === b.opponent!.hero)?.name ?? 'l’adversaire'}`;
  return SITES.find((p) => p.id === b.site)?.name ?? 'Bataille';
}
