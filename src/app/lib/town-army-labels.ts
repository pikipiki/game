import type { GameState } from '@/game/engine';
import {
  buildArmyUnitCardLabels,
  type ArmyUnitCardLabels,
} from '@/app/lib/army-unit-card-copy';
import type { TranslateFn } from '@/i18n/translate';

export function buildTownArmyUnitLabels(
  state: GameState,
  t: TranslateFn,
): Record<string, ArmyUnitCardLabels> {
  const labels: Record<string, ArmyUnitCardLabels> = {};
  for (const unit of state.army) {
    const copy = buildArmyUnitCardLabels(state, unit.id, t);
    if (copy) labels[unit.id] = copy;
  }
  return labels;
}
