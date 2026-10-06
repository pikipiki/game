import { getCreature, BATTLE_TILES, BATTLE_WIDTH } from '../data';
import {
  activeUnit,
  reachable,
  unitCount,
  type Fighter,
  type GameState,
} from '../engine';
import {
  battleControls,
  cellName,
  turnOrder,
  type BattleSelection,
} from './controls';
import {
  BATTLE_LOG_LINES,
  LABEL_BATTLE_JOURNAL,
  LABEL_CAST_SPELL,
  LABEL_HP_UNIT,
  LABEL_ROSTER_HEADING,
  LABEL_STAT_ATTACK,
  LABEL_STAT_DEFENSE,
  LABEL_STAT_RANGED,
  LABEL_STAT_SPEED,
  LABEL_TACTICAL_MOVES,
  SPELL_MANA_COST,
} from './constants';
import {
  activeUnitRoleLabel,
  allyBannerSubtitle,
  allyBannerTitle,
  battleResultHeading,
  battleResultSummary,
  combatEyebrow,
  combatInstructionHint,
  combatTitle,
  enemyFactionLabel,
  fighterEyebrow,
  finishBattleLabel,
  healthBarPercent,
  initiativeAriaPrefix,
  initiativeButtonClass,
  initiativeTitleSuffix,
  initiativeTurnLabel,
  rangedStatLabel,
  retaliationFinePrint,
  rosterUnitCssClass,
  siegeHint,
  spellButtonClass,
  unitSideLabel,
  waitFinePrint,
  wallStatusHeading,
} from './labels';

export interface RosterUnitModel {
  id: string;
  side: Fighter['side'];
  cssExtra: string;
  ariaLabel: string;
  name: string;
  subtitle: string;
  healthPercent: number;
  creatureId: string;
}

export interface InitiativeUnitModel {
  id: string;
  side: Fighter['side'];
  buttonClass: string;
  title: string;
  ariaLabel: string;
  count: number;
  creatureId: string;
}

export interface CombatChromeModel {
  eyebrow: string;
  title: string;
  round: number;
  allyTitle: string;
  allySubtitle: string;
  enemyLabel: string;
  enemyCount: string;
  initiative: InitiativeUnitModel[];
  turnLabel: string;
  siege: { heading: string; hint: string } | null;
  roster: RosterUnitModel[];
  latestLog: string;
}

export interface CombatCommandModel {
  gameAction: string;
  label: string;
  disabled: boolean;
  className?: string;
  ariaPressed?: boolean;
  ariaLabel?: string;
}

export interface CombatToolbarModel {
  kind: 'commands' | 'summary';
  activeCreatureId?: string;
  roleLabel?: string;
  activeName?: string;
  activeSubtitle?: string;
  hint?: string;
  commands?: CombatCommandModel[];
  castSpell?: boolean;
  castSpellEnabled?: boolean;
  summaryHeading?: string;
  summaryText?: string;
  continueLabel?: string;
  castSpellLabel?: string;
}

function rosterUnitModel(
  game: GameState,
  unit: Fighter,
  selection: BattleSelection,
): RosterUnitModel {
  const battle = game.battle!;
  const creature = getCreature(unit.creature);
  const cssExtra = rosterUnitCssClass(unit.id, selection.unit, battle.active);
  const sideLabel = unitSideLabel(unit.side);
  return {
    id: unit.id,
    side: unit.side,
    cssExtra,
    ariaLabel: `Sélectionner ${creature.name} ${sideLabel}`,
    name: creature.name,
    subtitle: `${unitCount(unit)} unités · ${unit.hp} PV · ${cellName(unit)}`,
    healthPercent: healthBarPercent(unit.hp, unit.maxHp),
    creatureId: unit.creature,
  };
}

export function buildCombatChromeModel(
  game: GameState,
  selection: BattleSelection,
  isTraining: boolean,
): CombatChromeModel {
  const battle = game.battle!;
  const enemyCreatureCount = battle.units
    .filter((unit) => unit.side === 'enemy' && unit.hp > 0)
    .reduce((total, unit) => total + unitCount(unit), 0);
  const hasArmyBackup = Boolean(battle.opponent?.armyBackup);
  let siege: CombatChromeModel['siege'] = null;
  if (battle.siege) {
    const isDefendingTown = Boolean(battle.opponent?.town);
    siege = {
      heading: wallStatusHeading(
        battle.siege.wallHp,
        battle.siege.maxWallHp,
      ),
      hint: siegeHint(isDefendingTown, battle.siege.wallHp),
    };
  }
  const living = battle.units.filter((unit) => unit.hp > 0);
  return {
    eyebrow: combatEyebrow(game, isTraining),
    title: combatTitle(game, isTraining),
    round: battle.round,
    allyTitle: allyBannerTitle(hasArmyBackup),
    allySubtitle: allyBannerSubtitle(game, hasArmyBackup),
    enemyLabel: enemyFactionLabel(),
    enemyCount: `${enemyCreatureCount} créatures`,
    initiative: turnOrder(game).map((unit, index) => {
      const creature = getCreature(unit.creature);
      return {
        id: unit.id,
        side: unit.side,
        buttonClass: initiativeButtonClass(index),
        title: `${creature.name} · ${initiativeTitleSuffix(index)}`,
        ariaLabel: `${initiativeAriaPrefix(index)} : ${creature.name}`,
        count: unitCount(unit),
        creatureId: unit.creature,
      };
    }),
    turnLabel: initiativeTurnLabel(game),
    siege,
    roster: living.map((unit) => rosterUnitModel(game, unit, selection)),
    latestLog: game.log[0] ?? '',
  };
}

function canCastSpell(
  game: GameState,
  controls: ReturnType<typeof battleControls>,
): boolean {
  const battle = game.battle!;
  if (!controls.canPlay) return false;
  if (battle.opponent?.armyBackup) return false;
  if (game.mana < SPELL_MANA_COST) return false;
  if (battle.spellRound === battle.round) return false;
  return true;
}

export function buildCombatToolbarModel(
  game: GameState,
  selection: BattleSelection,
  isTraining: boolean,
): CombatToolbarModel | null {
  const battle = game.battle!;
  if (battle.result) {
    const result = battle.result as 'victory' | 'defeat';
    return {
      kind: 'summary',
      summaryHeading: battleResultHeading(result),
      summaryText: battleResultSummary(result),
      continueLabel: finishBattleLabel(isTraining),
    };
  }
  const controls = battleControls(game, selection);
  const activeFighter = activeUnit(game)!;
  const creature = getCreature(activeFighter.creature);
  const moveEnabled = controls.move && !selection.spell;
  const attackEnabled = controls.attack && !selection.spell;
  const waitEnabled = controls.canPlay && !activeFighter.waited;
  const spellsEnabled = canCastSpell(game, controls);
  const commands: CombatCommandModel[] = [
    {
      gameAction: 'audio-settings',
      label: '♫',
      disabled: false,
      ariaLabel: 'Musique et bruitages',
    },
    {
      gameAction: 'confirm-move',
      label: 'Déplacer',
      disabled: !moveEnabled,
    },
    {
      gameAction: 'confirm-attack',
      label: 'Attaquer',
      disabled: !attackEnabled,
      className: 'attack-command',
    },
    {
      gameAction: 'defend',
      label: 'Défendre',
      disabled: !controls.canPlay,
    },
    {
      gameAction: 'wait',
      label: 'Attendre',
      disabled: !waitEnabled,
    },
    {
      gameAction: 'bolt',
      label: `Éclair · ${SPELL_MANA_COST}`,
      disabled: !spellsEnabled,
      className: spellButtonClass(selection.spell, 'bolt'),
      ariaPressed: selection.spell === 'bolt',
    },
    {
      gameAction: 'heal',
      label: `Soin · ${SPELL_MANA_COST}`,
      disabled: !spellsEnabled,
      className: spellButtonClass(selection.spell, 'heal'),
      ariaPressed: selection.spell === 'heal',
    },
  ];
  const isAttackingSiege = battle.siege && !battle.opponent?.town;
  if (isAttackingSiege) {
    const catapultEnabled = controls.canPlay && battle.siege!.wallHp > 0;
    commands.push({
      gameAction: 'catapult',
      label: 'Catapulte',
      disabled: !catapultEnabled,
    });
  }
  return {
    kind: 'commands',
    activeCreatureId: activeFighter.creature,
    roleLabel: activeUnitRoleLabel(activeFighter.side),
    activeName: creature.name,
    activeSubtitle: `${unitCount(activeFighter)} unités · ${activeFighter.hp} PV`,
    hint: combatInstructionHint(selection, controls),
    commands,
    castSpell: Boolean(selection.spell),
    castSpellEnabled: controls.cast,
    castSpellLabel: LABEL_CAST_SPELL,
  };
}

export interface FighterPanelModel {
  eyebrow: string;
  creatureId: string;
  name: string;
  tierLine: string;
  hp: number;
  maxHp: number;
  healthPercent: number;
  attack: number;
  defense: number;
  ranged: string;
  speed: number;
  description: string;
  finePrint: string;
  damageForecast: string | null;
  roster: RosterUnitModel[];
  logLines: string[];
  rosterHeading: string;
  tacticalMovesLabel: string;
  journalEyebrow: string;
  statAttackLabel: string;
  statDefenseLabel: string;
  statRangedLabel: string;
  statSpeedLabel: string;
  hpUnitLabel: string;
}

export function buildFighterPanelModel(
  game: GameState,
  selection: BattleSelection,
): FighterPanelModel {
  const controls = battleControls(game, selection);
  let focusedUnit = activeUnit(game)!;
  if (controls.target) focusedUnit = controls.target;
  const creature = getCreature(focusedUnit.creature);
  let damageForecast: string | null = null;
  if (controls.attack) {
    damageForecast =
      `${controls.hits} dégâts · ${controls.loss} pertes prévues`;
  }
  const living = game.battle!.units.filter((unit) => unit.hp > 0);
  return {
    eyebrow: fighterEyebrow(focusedUnit.side, focusedUnit),
    creatureId: focusedUnit.creature,
    name: creature.name,
    tierLine: `${unitCount(focusedUnit)} créatures · Niveau ${creature.tier}`,
    hp: focusedUnit.hp,
    maxHp: focusedUnit.maxHp,
    healthPercent: healthBarPercent(focusedUnit.hp, focusedUnit.maxHp),
    attack: creature.attack,
    defense: creature.defense,
    ranged: rangedStatLabel(creature, focusedUnit),
    speed: creature.speed,
    description: creature.description,
    finePrint: `${retaliationFinePrint(focusedUnit)}${waitFinePrint(focusedUnit)}`,
    damageForecast,
    roster: living.map((unit) => rosterUnitModel(game, unit, selection)),
    logLines: game.log.slice(0, BATTLE_LOG_LINES),
    rosterHeading: LABEL_ROSTER_HEADING,
    tacticalMovesLabel: LABEL_TACTICAL_MOVES,
    journalEyebrow: LABEL_BATTLE_JOURNAL,
    statAttackLabel: LABEL_STAT_ATTACK,
    statDefenseLabel: LABEL_STAT_DEFENSE,
    statRangedLabel: LABEL_STAT_RANGED,
    statSpeedLabel: LABEL_STAT_SPEED,
    hpUnitLabel: LABEL_HP_UNIT,
  };
}

export interface TacticalCellModel {
  q: number;
  r: number;
  label: string;
  allowed: boolean;
}

export function buildTacticalGridModel(game: GameState): TacticalCellModel[] {
  const legalMoves = reachable(game);
  return Array.from({ length: BATTLE_TILES.length }, (_unused, index) => {
    const column = index % BATTLE_WIDTH;
    const row = Math.floor(index / BATTLE_WIDTH);
    const hex = { q: column, r: row };
    const isAllowed = legalMoves.some(
      (move) => move.q === column && move.r === row,
    );
    return {
      q: column,
      r: row,
      label: cellName(hex),
      allowed: isAllowed,
    };
  });
}

