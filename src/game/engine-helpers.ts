import {
  BATTLE_TILES,
  BATTLE_WIDTH,
  SITES,
  WORLD,
  battleDistance,
  distance,
  getCreature,
  key,
  type Hex,
} from './data';
import type {
  BuildingId,
  Family,
  Fighter,
  GameState,
  Stack,
} from './types';

export function recruitStock(game: GameState, family: Family): number {
  const stock = game.available?.[family];
  if (stock !== undefined) {
    return stock;
  }
  if (family === 'sylve') {
    return 12;
  }
  return 9;
}

export function weeklyGrowth(game: GameState, family: Family): number {
  let weeklyBase = 4;
  if (family === 'sylve') {
    weeklyBase = 6;
  }
  return Math.round((weeklyBase * (game.castle + 1)) / 2);
}

export function maxMovement(game: GameState): number {
  return 6 + game.castle;
}

export function maxMana(game: GameState): number {
  return 8 + game.castle * 2;
}

function homeIncome(game: GameState): number {
  if (!game.owned.includes('home')) {
    return 0;
  }
  return 200 + game.castle * 50;
}

function goldSiteIncome(game: GameState): number {
  if (game.owned.includes('gold')) {
    return 150;
  }
  return 0;
}

export function income(game: GameState): number {
  const enemyCastles = game.owned.filter((siteId) =>
    ['shade-castle', 'dawn-castle'].includes(siteId),
  ).length;
  return homeIncome(game) + goldSiteIncome(game) + enemyCastles * 150;
}

export function friendlyTown(game: GameState): boolean {
  return SITES.some(
    (site) =>
      site.kind === 'castle' &&
      game.owned.includes(site.id) &&
      key(site) === key(game.hero),
  );
}

export function battleGround(game: GameState): Hex[] {
  return BATTLE_TILES.filter((tile) => {
    const wallBlocksTile = Boolean(game.battle?.siege?.wallHp) && tile.q === 12;
    const blockedByObstacle = game.battle?.obstacles?.some(
      (obstacle) => key(obstacle) === key(tile),
    );
    return !wallBlocksTile && !blockedByObstacle;
  });
}

export function activeUnit(game: GameState): Fighter | undefined {
  const battle = game.battle;
  if (!battle) {
    return undefined;
  }
  return battle.units.find((unit) => unit.id === battle.active);
}

export function movementRange(fighter: Fighter): number {
  if (fighter.slowed) {
    return 1;
  }
  return getCreature(fighter.creature).speed;
}

function sparkDamageMultiplier(creatureId: string): number {
  const stats = getCreature(creatureId);
  if (stats.ability === 'spark' && stats.tier > 1) {
    return 1.2;
  }
  return 1;
}

function rangedDamageMultiplier(attacker: Fighter, defender: Fighter): number {
  const stats = getCreature(attacker.creature);
  if (stats.range <= 1) {
    return 1;
  }
  const gap = battleDistance(attacker, defender);
  if (gap === 1 || gap > 8) {
    return 0.5;
  }
  return 1;
}

function defendingDamageMultiplier(defender: Fighter): number {
  if (defender.defending) {
    return 0.55;
  }
  return 1;
}

function guardDamageMultiplier(creatureId: string): number {
  if (getCreature(creatureId).ability === 'guard') {
    return 0.75;
  }
  return 1;
}

export function unitCount(fighter: Fighter): number {
  return Math.ceil(fighter.hp / getCreature(fighter.creature).hp);
}

export function damage(attacker: Fighter, defender: Fighter): number {
  const attackerStats = getCreature(attacker.creature);
  const defenderStats = getCreature(defender.creature);
  const base =
    unitCount(attacker) *
    attackerStats.attack *
    (1 - defenderStats.defense / 25) *
    sparkDamageMultiplier(attacker.creature) *
    rangedDamageMultiplier(attacker, defender);
  return Math.max(
    1,
    Math.round(
      base *
        defendingDamageMultiplier(defender) *
        guardDamageMultiplier(defender.creature),
    ),
  );
}

export function defaultBattleFoes(difficulty: number): Stack[] {
  if (difficulty === 1) {
    return [
      { id: 'enemy-0', creature: 'sylve', count: 5, xp: 0 },
      { id: 'enemy-1', creature: 'sol', count: 4, xp: 0 },
    ];
  }
  if (difficulty === 2) {
    return [
      { id: 'enemy-0', creature: 'sylve-guard', count: 7, xp: 0 },
      { id: 'enemy-1', creature: 'sol-flame', count: 5, xp: 0 },
    ];
  }
  return [
    { id: 'enemy-0', creature: 'sylve-ancient', count: 9, xp: 0 },
    { id: 'enemy-1', creature: 'sol-phoenix', count: 7, xp: 0 },
    { id: 'enemy-2', creature: 'sol-star', count: 6, xp: 0 },
  ];
}

function battleColumn(defending: boolean, allySide: boolean): number {
  if (allySide) {
    if (defending) {
      return BATTLE_WIDTH - 1;
    }
    return 0;
  }
  if (defending) {
    return 0;
  }
  return BATTLE_WIDTH - 1;
}

function initialShots(creatureId: string): number {
  if (getCreature(creatureId).range > 1) {
    return 12;
  }
  return 0;
}

export function fighterFromStack(
  stack: Stack,
  index: number,
  side: 'ally' | 'enemy',
  defending: boolean,
): Fighter {
  return {
    ...stack,
    q: battleColumn(defending, side === 'ally'),
    r: Math.min(10, 1 + index * 3),
    side,
    hp: stack.count * getCreature(stack.creature).hp,
    maxHp: stack.count * getCreature(stack.creature).hp,
    slowed: false,
    defending: false,
    shots: initialShots(stack.creature),
    waited: false,
    retaliated: false,
  };
}

export function revealExplored(game: GameState): void {
  const nearby = WORLD.filter((tile) => distance(tile, game.hero) <= 2).map(
    key,
  );
  game.explored = [...new Set([...game.explored, ...nearby])];
}

export function appendLog(game: GameState, message: string): void {
  game.log = [message, ...game.log].slice(0, 18);
}

export function strikeRiposteSuffix(reply: number): string {
  if (reply > 0) {
    return ` Riposte : ${reply} dégâts.`;
  }
  return '';
}

export function battleOpeningLabel(game: GameState): string {
  if (game.battle?.siege) {
    return 'Siège';
  }
  return 'Bataille';
}

export function defaultGarrison(game: GameState): Stack[] {
  return [
    {
      id: 'garrison-sylve',
      creature: 'sylve',
      count: 4 + game.castle * 2,
      xp: 0,
    },
    { id: 'garrison-sol', creature: 'sol', count: 3 + game.castle, xp: 0 },
  ];
}

export function crystalIncomePerDay(game: GameState): number {
  if (game.owned.includes('crystal')) {
    return 3;
  }
  return 0;
}

export function enemyGoldMineBonus(game: GameState): number {
  if (game.enemyOwned?.includes('gold')) {
    return 150;
  }
  return 0;
}

export function enemyCrystalIncome(game: GameState): number {
  if (game.enemyOwned?.includes('crystal')) {
    return 3;
  }
  return 0;
}

export function enemyRecruitIncrement(stackIndex: number): number {
  if (stackIndex === 0) {
    return 2;
  }
  return 1;
}

export function survivorStackCount(
  unit: Fighter,
  retreat: boolean,
  side: 'ally' | 'enemy',
): number {
  let ratio = 1;
  if (retreat && side === 'ally') {
    ratio = 0.8;
  }
  return Math.max(1, Math.floor(unitCount(unit) * ratio));
}

export function survivorStackXp(
  unit: Fighter,
  victory: boolean,
  side: 'ally' | 'enemy',
): number {
  let bonus = 0;
  if (victory && side === 'ally') {
    bonus = 40;
  }
  return unit.xp + bonus;
}

export function adventureBattleXp(
  victory: boolean,
  difficulty: number,
): number {
  if (!victory) {
    return 15;
  }
  if (difficulty === 1) {
    return 55;
  }
  return 75;
}

export function adventureVictoryGold(difficulty: number): number {
  if (difficulty === 1) {
    return 450;
  }
  return 700;
}

export function adventureVictoryCrystals(difficulty: number): number {
  if (difficulty === 1) {
    return 6;
  }
  return 10;
}

export function upgradeRequiredBuilding(castleLevel: number): BuildingId {
  if (castleLevel === 1) {
    return 'hall';
  }
  return 'forge';
}

export function catapultLogMessage(wallHp: number): string {
  if (wallHp > 0) {
    return `La catapulte frappe les remparts : ${wallHp}/180 PV.`;
  }
  return 'Les remparts s’effondrent ! Le passage est ouvert.';
}

export function recruitLogCreatureName(
  existingUnit: Stack | undefined,
  familyCreatureName: string,
): string {
  if (existingUnit) {
    return getCreature(existingUnit.creature).name;
  }
  return familyCreatureName;
}

export function defeatedHeroName(heroName: string | undefined): string {
  if (heroName) {
    return heroName;
  }
  return 'Le héros adverse';
}
