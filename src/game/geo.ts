import type { Hex } from './types';

export const key = (hex: Hex) => `${hex.q},${hex.r}`;

export const distance = (hexA: Hex, hexB: Hex) =>
  (Math.abs(hexA.q - hexB.q) +
    Math.abs(hexA.r - hexB.r) +
    Math.abs(hexA.q + hexA.r - hexB.q - hexB.r)) /
  2;
