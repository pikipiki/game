import { CreaturePortrait } from '@/app/components/ui/CreaturePortrait';
import { GameActionButton } from '@/app/components/ui/GameActionButton';
import { getCreature } from '@/game/data';
import type { RosterUnitModel } from '@/app/types/combat-presentation';

export interface CombatRosterButtonViewProps {
  readonly unit: RosterUnitModel;
}

export function CombatRosterButtonView({ unit }: CombatRosterButtonViewProps) {
  const creature = getCreature(unit.creatureId);
  const className = `combat-roster-unit ${unit.side} ${unit.cssExtra}`;

  return (
    <GameActionButton
      actionId={unit.id}
      aria-label={unit.ariaLabel}
      className={className}
      gameAction="select-fighter"
      variant="text"
    >
      <CreaturePortrait creature={creature} />
      <span>
        <strong>{unit.name}</strong>
        <small>{unit.subtitle}</small>
        <i className="health-track">
          <i style={{ width: `${unit.healthPercent}%` }} />
        </i>
      </span>
    </GameActionButton>
  );
}
