import { getCreature, key, type Hex } from '../data';
import {
  activeUnit,
  attackPosition,
  damage,
  reachable,
  unitCount,
  type Fighter,
  type GameState,
} from '../engine';
import { SPELL_MANA_COST } from './constants';

export interface BattleSelection {
  unit: string | null;
  hex: Hex | null;
  spell: 'bolt' | 'heal' | null;
}

export const cellName = (hex: Hex) =>
  `${String.fromCodePoint(65 + hex.q)}${hex.r + 1}`;

function expectedSpellTargetSide(spell: 'bolt' | 'heal'): Fighter['side'] {
  if (spell === 'bolt') return 'enemy';
  return 'ally';
}

function predictedUnitLoss(target: Fighter, hitPoints: number): number {
  const creature = getCreature(target.creature);
  const remainingHealth = Math.max(0, target.hp - hitPoints);
  const stacksAfter = Math.ceil(remainingHealth / creature.hp);
  return unitCount(target) - stacksAfter;
}

export function turnOrder(game: GameState): Fighter[] {
  const battle = game.battle;
  if (!battle || battle.result) return [];
  const waitingIds = battle.waiting ?? [];
  const turnIds = [battle.active, ...battle.queue, ...waitingIds];
  return turnIds
    .map((unitId) => battle.units.find((unit) => unit.id === unitId))
    .filter((unit): unit is Fighter => Boolean(unit && unit.hp > 0));
}

export function battleControls(game: GameState, selection: BattleSelection) {
  const battle = game.battle;
  const activeFighter = activeUnit(game);
  const target = battle?.units.find(
    (unit) => unit.id === selection.unit && unit.hp > 0,
  );
  const playerCanAct = Boolean(
    battle && !battle.result && activeFighter?.side === 'ally',
  );
  const selectedHexIsLegal =
    Boolean(selection.hex) &&
    reachable(game).some((tile) => key(tile) === key(selection.hex!));
  const move = playerCanAct && selectedHexIsLegal;

  let approach: ReturnType<typeof attackPosition> = null;
  if (playerCanAct && target) {
    approach = attackPosition(game, target);
  }
  const attack = Boolean(approach);

  let cast = false;
  if (
    playerCanAct &&
    target &&
    selection.spell &&
    game.mana >= SPELL_MANA_COST &&
    !battle?.opponent?.armyBackup &&
    battle?.spellRound !== battle?.round
  ) {
    const requiredSide = expectedSpellTargetSide(selection.spell);
    cast = target.side === requiredSide;
  }

  let hits = 0;
  if (attack && activeFighter && target && approach) {
    hits = damage({ ...activeFighter, ...approach }, target);
  }

  let loss = 0;
  if (target) {
    loss = predictedUnitLoss(target, hits);
  }

  return {
    target,
    canPlay: playerCanAct,
    move,
    attack,
    cast,
    hits,
    loss,
    approach,
  };
}
