import { SITES, key } from '@/game/data';
import type { GameState } from '@/game/engine';

export function homeCastleSite(state: GameState) {
  return SITES.find(
    (site) =>
      site.kind === 'castle' &&
      state.owned.includes(site.id) &&
      key(site) === key(state.hero),
  );
}

export function isHomeCastle(state: GameState): boolean {
  const start = SITES[0];
  if (!start) return false;
  return key(state.hero) === key(start);
}
