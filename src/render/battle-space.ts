import { BATTLE_TILES, BATTLE_WIDTH, BATTLE_HEIGHT, key, type Hex } from '../game/data';
export const BATTLE_CENTER_X = (Math.sqrt(3) * (BATTLE_WIDTH - 0.5)) / 2;
export const BATTLE_CENTER_Z = ((BATTLE_HEIGHT - 1) * 1.5) / 2;
export const battlePoint = (h: Hex) => ({
  x: Math.sqrt(3) * (h.q + (h.r % 2) / 2) - BATTLE_CENTER_X,
  z: 1.5 * h.r - BATTLE_CENTER_Z,
});
/** Choose the nearest staggered hex centre only within its actual hexagon. */
export function battleHexAt(x: number, z: number): Hex | null {
  let best: Hex | null = null,
    score = Infinity;
  for (const h of BATTLE_TILES) {
    const p = battlePoint(h),
      d = (x - p.x) ** 2 + (z - p.z) ** 2;
    if (d < score) {
      score = d;
      best = h;
    }
  }
  if (!best) return null;
  const p = battlePoint(best),
    dx = Math.abs(x - p.x),
    dz = Math.abs(z - p.z);
  return dx <= Math.sqrt(3) / 2 + 0.001 && dz <= 1 - dx / Math.sqrt(3) + 0.001 ? best : null;
}
export const sameCell = (a: Hex, b: Hex) => key(a) === key(b);
