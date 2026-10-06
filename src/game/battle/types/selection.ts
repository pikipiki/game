import type { Hex } from '@/game/types';

export interface BattleSelection {
  unit: string | null;
  hex: Hex | null;
  spell: 'bolt' | 'heal' | null;
}
