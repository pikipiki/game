import { getCreature } from '@/game/data';
import type { ArmyUnitCardLabels } from '@/app/lib/army-unit-card-copy';
import type { GameState } from '@/game/engine';
import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionButton } from '@/app/components/ui/GameActionButton';

export interface ArmyUnitCardViewProps {
  readonly state: GameState;
  readonly unitId: string;
  readonly labels: ArmyUnitCardLabels;
}

export function ArmyUnitCardView({
  state,
  unitId,
  labels,
}: ArmyUnitCardViewProps) {
  const unit = state.army.find((armyUnit) => armyUnit.id === unitId);
  if (!unit) return null;
  const creature = getCreature(unit.creature);

  return (
    <GameActionButton
      actionId={unit.id}
      className="army-card"
      gameAction="creature"
      variant="text"
    >
      <div className="avatar" style={{ '--accent': creature.accent } as object}>
        <CreaturePortrait creature={creature} />
      </div>
      <div className="army-info">
        <small>{labels.eyebrow}</small>
        <strong>{labels.creatureName}</strong>
        <span>{labels.subtitle}</span>
      </div>
      <b className="army-count">
        {unit.count}
        <small>{labels.unitsWord}</small>
      </b>
    </GameActionButton>
  );
}
