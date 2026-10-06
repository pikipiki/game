import { SITES, key, type Hex } from '@/game/data';
import type { GameState } from '@/game/engine';

/** Château allié sur cette case (pas garnison ennemie). */
export function ownedCastleAt(hex: Hex, state: GameState) {
  const site = SITES.find((entry) => key(entry) === key(hex));
  if (!site || site.kind !== 'castle') return undefined;
  if (!state.owned.includes(site.id)) return undefined;
  if (state.enemyOwned?.includes(site.id)) return undefined;
  return site;
}

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
