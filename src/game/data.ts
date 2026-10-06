import { BATTLE_HEIGHT, BATTLE_WIDTH, DIRECTIONS } from './constants';
import { distance, key } from './geo';
import type { Hex } from './types';

export type {
  Family,
  Creature,
  Terrain,
  Tile,
  SiteKind,
  Site,
  Hex,
} from './types';
export {
  CREATURES,
  SITES,
  DIRECTIONS,
  WORLD,
  WORLD_BY_KEY,
  worldTileAt,
  BATTLE_WIDTH,
  BATTLE_HEIGHT,
  BATTLE_TILES,
  WALKABLE,
} from './constants';
export { key, distance } from './geo';
export { getCreature } from './creature-catalog';

export const battleAxial = (hex: Hex): Hex => ({
  q: hex.q - Math.floor(hex.r / 2),
  r: hex.r,
});
export const battleDistance = (hexA: Hex, hexB: Hex) =>
  distance(battleAxial(hexA), battleAxial(hexB));

export const battleNeighbors = (hex: Hex) => {
  const axial = battleAxial(hex);
  return DIRECTIONS.map((dir) => ({
    q: axial.q + dir.q + Math.floor((axial.r + dir.r) / 2),
    r: axial.r + dir.r,
  })).filter(
    (tile) =>
      tile.q >= 0 &&
      tile.q < BATTLE_WIDTH &&
      tile.r >= 0 &&
      tile.r < BATTLE_HEIGHT,
  );
};

export function battlePathTo(
  from: Hex,
  to: Hex,
  tiles: Hex[],
  blocked = new Set<string>(),
): Hex[] {
  const allowed = new Set(tiles.map(key)),
    queue: Hex[][] = [[from]],
    seen = new Set([key(from)]);
  for (const path of queue) {
    const last = path.at(-1);
    if (!last) continue;
    if (key(last) === key(to)) return path.slice(1);
    for (const next of battleNeighbors(last)) {
      if (
        allowed.has(key(next)) &&
        !blocked.has(key(next)) &&
        !seen.has(key(next))
      ) {
        seen.add(key(next));
        queue.push([...path, next]);
      }
    }
  }
  return [];
}

export function pathTo(
  from: Hex,
  to: Hex,
  tiles: Hex[],
  blocked: Set<string> = new Set(),
): Hex[] {
  const allowed = new Set(tiles.map(key));
  const queue: Hex[][] = [[from]],
    seen = new Set([key(from)]);
  for (const path of queue) {
    const last = path.at(-1);
    if (!last) continue;
    if (key(last) === key(to)) return path.slice(1);
    for (const dir of DIRECTIONS) {
      const next = { q: last.q + dir.q, r: last.r + dir.r },
        tileKey = key(next);
      if (allowed.has(tileKey) && !blocked.has(tileKey) && !seen.has(tileKey)) {
        seen.add(tileKey);
        queue.push([...path, next]);
      }
    }
  }
  return [];
}
