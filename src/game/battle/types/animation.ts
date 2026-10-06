import type { Hex } from '@/game/types';

export interface AnimationPlan {
  kind: 'move' | 'attack' | 'bolt' | 'heal' | 'defend' | 'catapult';
  actor: string;
  target: string | null;
  ranged: boolean;
  path: Hex[];
  changes: { id: string; amount: number; defeated: boolean }[];
  duration: number;
}
