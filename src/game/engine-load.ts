import { BUILDINGS, INITIAL_BUILDINGS } from './buildings';
import {
  BATTLE_TILES,
  CREATURES,
  SITES,
  WALKABLE,
  WORLD,
  getCreature,
  key,
  type Hex,
} from './data';
import type { GameState, Stack } from './types';

function isNonNegativeInteger(value: unknown, max = 1_000_000): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

function isValidHex(coord: Hex): boolean {
  return coord && Number.isInteger(coord.q) && Number.isInteger(coord.r);
}

function isValidStack(unitStack: Stack): boolean {
  return (
    Boolean(unitStack) &&
    typeof unitStack.id === 'string' &&
    unitStack.id.length < 64 &&
    Object.hasOwn(CREATURES, unitStack.creature) &&
    isNonNegativeInteger(unitStack.count, 100_000) &&
    unitStack.count > 0 &&
    isNonNegativeInteger(unitStack.xp)
  );
}

function isIdList(list: string[], allowed: string[]): boolean {
  return Array.isArray(list) && list.every((item) => allowed.includes(item));
}

function enemyHeroIds(game: GameState): string[] {
  if (game.enemyHeroes) {
    return game.enemyHeroes.map((hero) => hero.id);
  }
  return [];
}

function armyValid(units: Stack[]): boolean {
  return (
    Array.isArray(units) &&
    units.length > 0 &&
    units.length <= 2 &&
    units.every(isValidStack) &&
    new Set(units.map((unit) => unit.id)).size === units.length
  );
}

function validateCoreState(game: GameState): boolean {
  const buildingIds = BUILDINGS.map((building) => building.id);
  const siteIds = SITES.map((site) => site.id);
  const clearedIds = SITES.filter((site) => site.difficulty > 0).map(
    (site) => site.id,
  );

  if (
    game?.version !== 1 ||
    !isNonNegativeInteger(game.day) ||
    game.day < 1 ||
    !isNonNegativeInteger(game.gold) ||
    !isNonNegativeInteger(game.crystals) ||
    !isNonNegativeInteger(game.mana, 14) ||
    !isNonNegativeInteger(game.castle, 3) ||
    game.castle < 1 ||
    !isNonNegativeInteger(game.movement, 9) ||
    !isNonNegativeInteger(game.recruited, 100_000) ||
    (game.buildDay !== undefined &&
      (!isNonNegativeInteger(game.buildDay) || game.buildDay > game.day)) ||
    (game.built !== undefined &&
      (!isIdList(game.built, buildingIds) ||
        new Set(game.built).size !== game.built.length ||
        !INITIAL_BUILDINGS.every((id) => game.built!.includes(id)))) ||
    (game.available !== undefined &&
      (!isNonNegativeInteger(game.available.sylve, 100_000) ||
        !isNonNegativeInteger(game.available.sol, 100_000))) ||
    !isValidHex(game.hero) ||
    !WALKABLE.some((tile) => key(tile) === key(game.hero)) ||
    !Array.isArray(game.army) ||
    game.army.length > 2 ||
    !game.army.every(isValidStack) ||
    new Set(game.army.map((unit) => unit.id)).size !== game.army.length ||
    !isIdList(game.owned, siteIds) ||
    !isIdList(game.cleared, clearedIds) ||
    !isIdList(game.explored, WORLD.map(key)) ||
    typeof game.won !== 'boolean' ||
    !Array.isArray(game.log) ||
    game.log.length > 18 ||
    !game.log.every((entry) => typeof entry === 'string' && entry.length < 400)
  ) {
    return false;
  }
  return true;
}

function validateOpponentMeta(game: GameState): boolean {
  const opponentPlaces = SITES.filter((site) =>
    ['gold', 'crystal', 'castle', 'fortress'].includes(site.kind),
  ).map((site) => site.id);

  if (
    game.enemyHeroes !== undefined &&
    (!Array.isArray(game.enemyHeroes) ||
      game.enemyHeroes.length > 2 ||
      !game.enemyHeroes.every(
        (hero) =>
          typeof hero.id === 'string' &&
          hero.id.length < 64 &&
          typeof hero.name === 'string' &&
          hero.name.length < 100 &&
          isValidHex(hero) &&
          WALKABLE.some((tile) => key(tile) === key(hero)) &&
          armyValid(hero.army),
      ) ||
      new Set(game.enemyHeroes.map((hero) => hero.id)).size !==
        game.enemyHeroes.length)
  ) {
    return false;
  }

  if (
    game.enemyOwned !== undefined &&
    (!isIdList(game.enemyOwned, opponentPlaces) ||
      game.enemyOwned.some((siteId) => game.owned.includes(siteId)))
  ) {
    return false;
  }

  if (
    game.enemyQueue !== undefined &&
    (!isIdList(game.enemyQueue, enemyHeroIds(game)) ||
      new Set(game.enemyQueue).size !== game.enemyQueue.length)
  ) {
    return false;
  }

  if (game.enemyGold !== undefined && !isNonNegativeInteger(game.enemyGold)) {
    return false;
  }

  if (
    game.enemyCrystals !== undefined &&
    !isNonNegativeInteger(game.enemyCrystals)
  ) {
    return false;
  }

  if (
    game.garrisons !== undefined &&
    (typeof game.garrisons !== 'object' ||
      game.garrisons === null ||
      Array.isArray(game.garrisons) ||
      !Object.entries(game.garrisons).every(
        ([siteId, units]) =>
          SITES.some((site) => site.id === siteId && site.kind === 'castle') &&
          armyValid(units),
      ))
  ) {
    return false;
  }

  return true;
}

function validateBattleState(game: GameState): boolean {
  const battle = game.battle;
  if (!battle) {
    return true;
  }

  if (
    battle.opponent &&
    (!game.enemyHeroes?.some((hero) => hero.id === battle.opponent!.hero) ||
      (battle.opponent.town !== undefined &&
        !SITES.some(
          (site) => site.id === battle.opponent!.town && site.kind === 'castle',
        )) ||
      (battle.opponent.captureTown !== undefined &&
        !SITES.some(
          (site) =>
            site.id === battle.opponent!.captureTown && site.kind === 'castle',
        )) ||
      (battle.opponent.armyBackup !== undefined &&
        (!battle.opponent.town || !armyValid(battle.opponent.armyBackup))))
  ) {
    return false;
  }

  const unitIds = battle.units?.map((unit) => unit.id) ?? [];

  if (
    (battle.waiting !== undefined && !isIdList(battle.waiting, unitIds)) ||
    (battle.spellRound !== undefined &&
      (!isNonNegativeInteger(battle.spellRound) ||
        battle.spellRound > battle.round)) ||
    (battle.obstacles !== undefined &&
      (!Array.isArray(battle.obstacles) ||
        battle.obstacles.length > 20 ||
        !battle.obstacles.every(
          (obstacle) =>
            isValidHex(obstacle) &&
            BATTLE_TILES.some((tile) => key(tile) === key(obstacle)),
        )))
  ) {
    return false;
  }

  if (
    battle.siege &&
    (!isNonNegativeInteger(battle.siege.wallHp, 180) ||
      battle.siege.maxWallHp !== 180)
  ) {
    return false;
  }

  if (
    !battle.siege &&
    SITES.some(
      (site) =>
        site.id === battle.site &&
        (site.kind === 'castle' || site.kind === 'fortress'),
    )
  ) {
    battle.siege = { wallHp: 180, maxWallHp: 180 };
  }

  const fightersValid = battle.units.every(
    (unit) =>
      isValidStack(unit) &&
      isValidHex(unit) &&
      BATTLE_TILES.some((tile) => key(tile) === key(unit)) &&
      ['ally', 'enemy'].includes(unit.side) &&
      isNonNegativeInteger(unit.hp) &&
      isNonNegativeInteger(unit.maxHp) &&
      unit.hp <= unit.maxHp &&
      unit.maxHp === unit.count * getCreature(unit.creature).hp &&
      typeof unit.slowed === 'boolean' &&
      typeof unit.defending === 'boolean' &&
      (unit.shots === undefined || isNonNegativeInteger(unit.shots, 12)) &&
      (unit.waited === undefined || typeof unit.waited === 'boolean') &&
      (unit.retaliated === undefined || typeof unit.retaliated === 'boolean'),
  );

  if (
    !SITES.some(
      (site) =>
        site.id === battle.site &&
        (site.difficulty > 0 || site.kind === 'castle'),
    ) ||
    !isNonNegativeInteger(battle.round) ||
    !Array.isArray(battle.units) ||
    battle.units.length < 2 ||
    battle.units.length > 5 ||
    !fightersValid ||
    new Set(battle.units.map((unit) => unit.id)).size !== battle.units.length ||
    !isIdList(battle.queue, unitIds) ||
    !battle.units.some((unit) => unit.id === battle.active) ||
    ![null, 'victory', 'defeat'].includes(battle.result)
  ) {
    return false;
  }

  return true;
}

/** Stored saves are untrusted input. Reject malformed, non-finite or incompatible values. */
export function loadGame(raw: string | null): GameState | null {
  try {
    if (!raw || raw.length > 100_000) {
      return null;
    }
    const game: GameState = JSON.parse(raw);
    if (!validateCoreState(game)) {
      return null;
    }
    if (!validateOpponentMeta(game)) {
      return null;
    }
    if (!validateBattleState(game)) {
      return null;
    }
    return game;
  } catch {
    return null;
  }
}
