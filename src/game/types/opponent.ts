import type { Hex } from './hex';
import type { Stack } from './stack';

export interface OpponentHero extends Hex {
  id: string;
  name: string;
  army: Stack[];
}
