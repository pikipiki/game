import type { BattleSelection } from '@/game/battle/controls';
import type { AppSnapshot } from '../store/app-store';

/** Sélecteur dérivé (équivalent `useMemo` sur un snapshot). */
export function selectBattleSelection(snapshot: AppSnapshot): BattleSelection {
  return {
    unit: snapshot.selectedFighter,
    hex: snapshot.selectedBattleHex,
    spell: snapshot.spell,
  };
}
