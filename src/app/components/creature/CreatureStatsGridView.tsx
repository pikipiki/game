import type { Creature } from '@/game/data';
import { GameIcon } from '@/app/components/ui/GameIcon';

export interface CreatureStatsGridViewProps {
  readonly creature: Creature;
  readonly combatLabel: string;
  readonly hpLabel: string;
  readonly attackLabel: string;
  readonly defenseLabel: string;
  readonly combatKindLabel: string;
}

export function CreatureStatsGridView({
  creature,
  combatLabel,
  hpLabel,
  attackLabel,
  defenseLabel,
  combatKindLabel,
}: CreatureStatsGridViewProps) {
  return (
    <div className="stats-grid">
      <span>
        <GameIcon name="heart" />
        <b>{creature.hp}</b>
        <small>{hpLabel}</small>
      </span>
      <span>
        <GameIcon name="sword" />
        <b>{creature.attack}</b>
        <small>{attackLabel}</small>
      </span>
      <span>
        <GameIcon name="shield" />
        <b>{creature.defense}</b>
        <small>{defenseLabel}</small>
      </span>
      <span>
        <GameIcon name="target" />
        <b>{combatLabel}</b>
        <small>{combatKindLabel}</small>
      </span>
    </div>
  );
}
