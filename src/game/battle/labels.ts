import { activeUnit, type Fighter, type GameState } from '../engine';
import { battleTitle } from '../opponent';
import { cellName, type BattleSelection } from './controls';
import {
  DEFAULT_RANGED_SHOTS,
  LABEL_ACTIVE_ALLY_UNIT,
  LABEL_ACTIVE_ENEMY_UNIT,
  LABEL_ALLY_GARRISON,
  LABEL_ALLY_HERO,
  LABEL_ALLY_SIDE,
  LABEL_BATTLE_CONTINUE,
  LABEL_BATTLE_OVER,
  LABEL_BATTLEFIELD_EYEBROW,
  LABEL_CASTLE_DEFENSE_EYEBROW,
  LABEL_DEFEAT_HEADING,
  LABEL_DEFEAT_SUMMARY,
  LABEL_ENEMY_FACTION,
  LABEL_ENEMY_SIDE,
  LABEL_ENEMY_TURN,
  LABEL_ENEMY_UNIT,
  LABEL_GARRISON_NO_SPELLS,
  LABEL_INITIATIVE_CURRENT,
  LABEL_INITIATIVE_NEXT,
  LABEL_INITIATIVE_UPCOMING,
  LABEL_MELEE,
  LABEL_OUT_OF_RANGE,
  LABEL_PICK_TILE_OR_ENEMY,
  LABEL_PLAYER_TURN,
  LABEL_RETALIATION_READY,
  LABEL_RETALIATION_USED,
  LABEL_SIEGE_BREACH_DEFEND,
  LABEL_SIEGE_DEFEND_WALLS,
  LABEL_SIEGE_ENTER_CASTLE,
  LABEL_SIEGE_EYEBROW,
  LABEL_SIEGE_USE_CATAPULT,
  LABEL_SPELL_TARGET_BOLT,
  LABEL_SPELL_TARGET_HEAL,
  LABEL_TRAINING_CONTINUE,
  LABEL_TRAINING_EYEBROW,
  LABEL_TRAINING_TITLE,
  LABEL_VICTORY_HEADING,
  LABEL_VICTORY_SUMMARY,
  LABEL_WAIT_USED,
  LABEL_WALLS_DESTROYED,
  LABEL_YOUR_UNIT,
  CSS_ARMED_SPELL,
  CSS_INITIATIVE_CURRENT,
} from './constants';
import type { Creature } from '../types/world';

type BattleResult = 'victory' | 'defeat';

export function htmlDisabledWhenInactive(isActive: boolean): string {
  if (isActive) return '';
  return 'disabled';
}

export function healthBarPercent(
  hitPoints: number,
  maxHitPoints: number,
): number {
  return (hitPoints / maxHitPoints) * 100;
}

export function rosterUnitCssClass(
  unitId: string,
  selectedUnitId: string | null,
  activeUnitId: string,
): string {
  let extra = '';
  if (unitId === selectedUnitId) extra += ' chosen';
  if (unitId === activeUnitId) extra += ' playing';
  return extra.trim();
}

export function unitSideLabel(side: Fighter['side']): string {
  if (side === 'ally') return LABEL_ALLY_SIDE;
  return LABEL_ENEMY_SIDE;
}

export function combatEyebrow(game: GameState, isTraining: boolean): string {
  if (isTraining) return LABEL_TRAINING_EYEBROW;
  const battle = game.battle!;
  if (battle.opponent?.town) return LABEL_CASTLE_DEFENSE_EYEBROW;
  if (battle.siege) return LABEL_SIEGE_EYEBROW;
  return LABEL_BATTLEFIELD_EYEBROW;
}

export function combatTitle(game: GameState, isTraining: boolean): string {
  if (isTraining) return LABEL_TRAINING_TITLE;
  return battleTitle(game);
}

export function allyBannerTitle(hasArmyBackup: boolean): string {
  if (hasArmyBackup) return LABEL_ALLY_GARRISON;
  return LABEL_ALLY_HERO;
}

export function allyBannerSubtitle(
  game: GameState,
  hasArmyBackup: boolean,
): string {
  if (hasArmyBackup) return LABEL_GARRISON_NO_SPELLS;
  return `${game.mana} points de mana`;
}

export function initiativeTurnLabel(game: GameState): string {
  const battle = game.battle!;
  if (battle.result) return LABEL_BATTLE_OVER;
  const current = activeUnit(game);
  if (current?.side === 'ally') return LABEL_PLAYER_TURN;
  return LABEL_ENEMY_TURN;
}

export function initiativeButtonClass(index: number): string {
  if (index === 0) return CSS_INITIATIVE_CURRENT;
  return '';
}

export function initiativeTitleSuffix(index: number): string {
  if (index === 0) return LABEL_INITIATIVE_CURRENT;
  return LABEL_INITIATIVE_UPCOMING;
}

export function initiativeAriaPrefix(index: number): string {
  if (index === 0) return LABEL_INITIATIVE_CURRENT;
  return LABEL_INITIATIVE_NEXT;
}

export function wallStatusHeading(
  wallHitPoints: number,
  maxWallHitPoints: number,
): string {
  if (wallHitPoints > 0) {
    return `Remparts : ${wallHitPoints} / ${maxWallHitPoints} PV`;
  }
  return LABEL_WALLS_DESTROYED;
}

export function siegeHint(
  isDefendingTown: boolean,
  wallHitPoints: number,
): string {
  if (isDefendingTown) {
    if (wallHitPoints > 0) return LABEL_SIEGE_DEFEND_WALLS;
    return LABEL_SIEGE_BREACH_DEFEND;
  }
  if (wallHitPoints > 0) return LABEL_SIEGE_USE_CATAPULT;
  return LABEL_SIEGE_ENTER_CASTLE;
}

export function battleResultHeading(result: BattleResult): string {
  if (result === 'victory') return LABEL_VICTORY_HEADING;
  return LABEL_DEFEAT_HEADING;
}

export function battleResultSummary(result: BattleResult): string {
  if (result === 'victory') return LABEL_VICTORY_SUMMARY;
  return LABEL_DEFEAT_SUMMARY;
}

export function finishBattleLabel(isTraining: boolean): string {
  if (isTraining) return LABEL_TRAINING_CONTINUE;
  return LABEL_BATTLE_CONTINUE;
}

export function spellTargetLabel(spell: 'bolt' | 'heal'): string {
  if (spell === 'bolt') return LABEL_SPELL_TARGET_BOLT;
  return LABEL_SPELL_TARGET_HEAL;
}

export function combatInstructionHint(
  selection: BattleSelection,
  controls: {
    attack: boolean;
    move: boolean;
    hits: number;
    loss: number;
    target?: Fighter | null;
  },
): string {
  if (selection.spell) {
    const targetLabel = spellTargetLabel(selection.spell);
    return `Sélectionnez ${targetLabel}, puis confirmez le sort.`;
  }
  if (controls.attack) {
    return `${controls.hits} dégâts prévus · ${controls.loss} créatures éliminées`;
  }
  if (controls.move && selection.hex) {
    return `Destination ${cellName(selection.hex)} : confirmez le déplacement.`;
  }
  if (controls.target?.side === 'enemy') return LABEL_OUT_OF_RANGE;
  return LABEL_PICK_TILE_OR_ENEMY;
}

export function activeUnitRoleLabel(side: Fighter['side']): string {
  if (side === 'ally') return LABEL_ACTIVE_ALLY_UNIT;
  return LABEL_ACTIVE_ENEMY_UNIT;
}

export function fighterEyebrow(side: Fighter['side'], unit: Fighter): string {
  let role = LABEL_ENEMY_UNIT;
  if (side === 'ally') role = LABEL_YOUR_UNIT;
  return `${role} · ${cellName(unit)}`;
}

export function rangedStatLabel(creature: Creature, unit: Fighter): string {
  if (creature.range > 1) {
    const shots = unit.shots ?? DEFAULT_RANGED_SHOTS;
    return String(shots);
  }
  return LABEL_MELEE;
}

export function retaliationFinePrint(unit: Fighter): string {
  if (unit.retaliated) return LABEL_RETALIATION_USED;
  return LABEL_RETALIATION_READY;
}

export function waitFinePrint(unit: Fighter): string {
  if (unit.waited) return LABEL_WAIT_USED;
  return '';
}

export function spellButtonClass(
  spell: BattleSelection['spell'],
  kind: 'bolt' | 'heal',
): string {
  if (spell === kind) return CSS_ARMED_SPELL;
  return '';
}

export function spellPressed(
  spell: BattleSelection['spell'],
  kind: 'bolt' | 'heal',
): string {
  if (spell === kind) return 'true';
  return 'false';
}

export function enemyFactionLabel(): string {
  return LABEL_ENEMY_FACTION;
}
