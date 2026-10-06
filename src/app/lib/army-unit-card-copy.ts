import type { GameState } from '@/game/engine';
import {
  armyFamilyEyebrow,
  armyUnitSubtitle,
  displayCreature,
} from '@/app/lib/creature-ui-copy';
import type { TranslateFn } from '@/i18n/translate';

export interface ArmyUnitCardLabels {
  readonly eyebrow: string;
  readonly subtitle: string;
  readonly unitsWord: string;
  readonly creatureName: string;
}

export function buildArmyUnitCardLabels(
  state: GameState,
  unitId: string,
  t: TranslateFn,
): ArmyUnitCardLabels | null {
  const unit = state.army.find((armyUnit) => armyUnit.id === unitId);
  if (!unit) return null;
  const creature = displayCreature(unit.creature, t);
  return {
    eyebrow: armyFamilyEyebrow(creature, t),
    subtitle: armyUnitSubtitle(unit, creature, t),
    unitsWord: t('creature.units'),
    creatureName: creature.name,
  };
}
