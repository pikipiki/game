import { distance } from '../geo';
import { SITES } from './sites';
import type { Hex } from '../types/hex';
import type { Terrain, Tile } from '../types/world';

export const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: -1, r: 1 },
];

export const BATTLE_WIDTH = 17;
export const BATTLE_HEIGHT = 11;

export const BATTLE_TILES: Hex[] = Array.from(
  { length: BATTLE_WIDTH * BATTLE_HEIGHT },
  (_unused, tileIndex) => ({
    q: tileIndex % BATTLE_WIDTH,
    r: Math.floor(tileIndex / BATTLE_WIDTH),
  }),
);

export const WORLD: Tile[] = [];
for (let col = -4; col <= 4; col++)
  {for (let row = -4; row <= 4; row++) {
    if (distance({ q: col, r: row }, { q: 0, r: 0 }) > 4) continue;
    let terrain: Terrain = 'grass';
    if ((col === -4 && row < 2) || (row === 4 && col > -2)) terrain = 'water';
    else if (
      (col === 0 && row === -3) ||
      (col === 1 && row === -3) ||
      (col === -1 && row === 4)
    )
      {terrain = 'mountain';}
    else if ((col * 7 + row * 13 + 37) % 4 === 0) terrain = 'forest';
    else if (col > 1 && row < 1) terrain = 'sand';
    if (SITES.some((site) => site.q === col && site.r === row)) {
      terrain = 'grass';
    }
    WORLD.push({ q: col, r: row, terrain });
  }}

export const WALKABLE = WORLD.filter(
  (tile) => tile.terrain !== 'water' && tile.terrain !== 'mountain',
);
