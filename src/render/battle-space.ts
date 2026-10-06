import {
  BATTLE_TILES,
  BATTLE_WIDTH,
  BATTLE_HEIGHT,
  key,
  type Hex,
} from '../game/data';

export const BATTLE_CENTER_X = (Math.sqrt(3) * (BATTLE_WIDTH - 0.5)) / 2;
export const BATTLE_CENTER_Z = ((BATTLE_HEIGHT - 1) * 1.5) / 2;

export const battlePoint = (hex: Hex) => ({
  x: Math.sqrt(3) * (hex.q + (hex.r % 2) / 2) - BATTLE_CENTER_X,
  z: 1.5 * hex.r - BATTLE_CENTER_Z,
});

/** Choose the nearest staggered hex centre only within its actual hexagon. */
export function battleHexAt(posX: number, posZ: number): Hex | null {
  let best: Hex | null = null;
  let score = Infinity;
  for (const tile of BATTLE_TILES) {
    const point = battlePoint(tile);
    const distSq = (posX - point.x) ** 2 + (posZ - point.z) ** 2;
    if (distSq < score) {
      score = distSq;
      best = tile;
    }
  }
  if (!best) {
    return null;
  }
  const point = battlePoint(best);
  const deltaX = Math.abs(posX - point.x);
  const deltaZ = Math.abs(posZ - point.z);
  const inside =
    deltaX <= Math.sqrt(3) / 2 + 0.001 &&
    deltaZ <= 1 - deltaX / Math.sqrt(3) + 0.001;
  if (inside) {
    return best;
  }
  return null;
}

export const sameCell = (left: Hex, right: Hex) => key(left) === key(right);
