import { initialOpponents, opponentRoute, type OpponentHero } from './opponent';
import {
  BUILDINGS,
  INITIAL_BUILDINGS,
  builtBuildings,
  constructionStatus,
} from './buildings';
import {
  battleDistance,
  battlePathTo,
  CREATURES,
  getCreature,
  SITES,
  WALKABLE,
  distance,
  key,
  pathTo,
  type Hex,
} from './data';
import {
  activeUnit,
  adventureBattleXp,
  adventureVictoryCrystals,
  adventureVictoryGold,
  appendLog,
  battleGround,
  battleOpeningLabel,
  catapultLogMessage,
  crystalIncomePerDay,
  damage,
  defaultBattleFoes,
  defaultGarrison,
  defeatedHeroName,
  enemyCrystalIncome,
  enemyGoldMineBonus,
  enemyRecruitIncrement,
  fighterFromStack,
  friendlyTown,
  income,
  maxMana,
  maxMovement,
  movementRange,
  recruitLogCreatureName,
  recruitStock,
  revealExplored,
  strikeRiposteSuffix,
  survivorStackCount,
  survivorStackXp,
  unitCount,
  upgradeRequiredBuilding,
  weeklyGrowth,
} from './engine-helpers';
import type { Action, Fighter, GameState, Stack } from './types';

export type { Action, Battle, Fighter, GameState, Stack } from './types';
export {
  activeUnit,
  battleGround,
  damage,
  friendlyTown,
  income,
  maxMana,
  maxMovement,
  movementRange,
  recruitStock,
  unitCount,
  weeklyGrowth,
} from './engine-helpers';
export { loadGame } from './engine-load';

export function newGame(): GameState {
  const game: GameState = {
    version: 1,
    day: 1,
    gold: 1050,
    crystals: 12,
    mana: 10,
    movement: 7,
    hero: { q: -3, r: 2 },
    army: [
      { id: 'army-sylve', creature: 'sylve', count: 8, xp: 0 },
      { id: 'army-sol', creature: 'sol', count: 6, xp: 0 },
    ],
    owned: ['home'],
    cleared: [],
    explored: [],
    castle: 1,
    built: [...INITIAL_BUILDINGS],
    buildDay: 0,
    available: { sylve: 12, sol: 0 },
    enemyHeroes: initialOpponents(),
    enemyOwned: ['shade-castle', 'dawn-castle', 'boss'],
    enemyQueue: [],
    enemyGold: 450,
    enemyCrystals: 8,
    garrisons: {},
    battle: null,
    won: false,
    log: ['Bienvenue, gardien. Le royaume de Pompon attend votre lumière.'],
    recruited: 0,
  };
  revealExplored(game);
  return game;
}

export function canAttack(
  attacker: Fighter,
  defender: Fighter,
  units: Fighter[] = [],
): boolean {
  if (attacker.side === defender.side || attacker.hp <= 0 || defender.hp <= 0)
    {return false;}
  const gap = battleDistance(attacker, defender);
  if (gap === 1) return true;
  return (
    getCreature(attacker.creature).range > 1 &&
    (attacker.shots ?? 12) > 0 &&
    !units.some(
      (unit) =>
        unit.hp > 0 &&
        unit.side !== attacker.side &&
        battleDistance(attacker, unit) === 1,
    )
  );
}

export function reachable(game: GameState): Hex[] {
  const activeFighter = activeUnit(game);
  if (!activeFighter || !game.battle || game.battle.result) {
    return [];
  }
  const blocked = new Set(
    game.battle.units
      .filter((unit) => unit.hp > 0 && unit.id !== activeFighter.id)
      .map(key),
  );
  return battleGround(game).filter((tile) => {
    const path = battlePathTo(activeFighter, tile, battleGround(game), blocked);
    return path.length > 0 && path.length <= movementRange(activeFighter);
  });
}

/** A melee stack can move next to its target and strike in the same turn. */
export function attackPosition(game: GameState, target: Fighter): Hex | null {
  const activeFighter = activeUnit(game);
  if (!activeFighter || activeFighter.side === target.side) {
    return null;
  }
  if (canAttack(activeFighter, target, game.battle!.units)) {
    return { q: activeFighter.q, r: activeFighter.r };
  }
  const options = reachable(game).filter(
    (tile) => battleDistance(tile, target) === 1,
  );
  const blocked = new Set(
    game
      .battle!.units.filter(
        (unit) => unit.hp > 0 && unit.id !== activeFighter.id,
      )
      .map(key),
  );
  options.sort(
    (hexA, hexB) =>
      battlePathTo(activeFighter, hexA, battleGround(game), blocked).length -
      battlePathTo(activeFighter, hexB, battleGround(game), blocked).length,
  );
  return options[0] ?? null;
}

function updateResult(game: GameState) {
  const battle = game.battle!;
  if (!battle.units.some((unit) => unit.side === 'enemy' && unit.hp > 0)) {
    battle.result = 'victory';
  } else if (
    !battle.units.some((unit) => unit.side === 'ally' && unit.hp > 0)
  ) {
    battle.result = 'defeat';
  }
}

function nextTurn(game: GameState) {
  const battle = game.battle!;
  updateResult(game);
  if (battle.result) {
    return;
  }
  battle.queue = battle.queue.filter((id) =>
    battle.units.some((unit) => unit.id === id && unit.hp > 0),
  );
  if (!battle.queue.length && battle.waiting?.length) {
    battle.queue = battle.waiting
      .filter((id) =>
        battle.units.some((unit) => unit.id === id && unit.hp > 0),
      )
      .sort(
        (idA, idB) => {
          const unitA = battle.units.find((unit) => unit.id === idA);
          const unitB = battle.units.find((unit) => unit.id === idB);
          if (!unitA || !unitB) {
            return 0;
          }
          return (
            getCreature(unitA.creature).speed -
            getCreature(unitB.creature).speed
          );
        },
      );
    battle.waiting = [];
  }
  if (!battle.queue.length) {
    battle.round++;
    battle.units.forEach((unit) => {
      unit.waited = false;
      unit.retaliated = false;
    });
    battle.queue = battle.units
      .filter((unit) => unit.hp > 0)
      .sort(
        (left, right) =>
          getCreature(right.creature).speed -
            getCreature(left.creature).speed ||
          left.id.localeCompare(right.id),
      )
      .map((unit) => unit.id);
  }
  battle.active = battle.queue.shift()!;
  const activeFighter = activeUnit(game)!;
  activeFighter.defending = false;
}

function strike(game: GameState, attacker: Fighter, defender: Fighter) {
  const melee = battleDistance(attacker, defender) === 1;
  const hit = damage(attacker, defender);
  if (!melee && getCreature(attacker.creature).range > 1) {
    attacker.shots = Math.max(0, (attacker.shots ?? 12) - 1);
  }
  defender.hp = Math.max(0, defender.hp - hit);
  const attackerStats = getCreature(attacker.creature);
  if (attackerStats.ability === 'root') {
    defender.slowed = true;
  }
  if (attackerStats.ability === 'heal' || attackerStats.ability === 'drain') {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.round(hit * 0.2));
  }
  let reply = 0;
  if (melee && defender.hp > 0 && !defender.retaliated) {
    defender.retaliated = true;
    const riposteAttacker = defender;
    const riposteTarget = attacker;
    reply = damage(riposteAttacker, riposteTarget);
    attacker.hp = Math.max(0, attacker.hp - reply);
    if (getCreature(defender.creature).ability === 'root') {
      attacker.slowed = true;
    }
  }
  appendLog(
    game,
    `${attackerStats.name} inflige ${hit} dégâts à ${getCreature(defender.creature).name}.${strikeRiposteSuffix(reply)}`,
  );
}

function startBattle(
  game: GameState,
  siteId: string,
  enemies?: Stack[],
  allies?: Stack[],
  defending = false,
) {
  const place = SITES.find((site) => site.id === siteId)!;
  const difficulty = place.difficulty || 1;
  const foes: Stack[] = enemies ?? defaultBattleFoes(difficulty);
  const allyStacks = allies ?? game.army;
  const units: Fighter[] = [
    ...allyStacks.map((stack, index) =>
      fighterFromStack(stack, index, 'ally', defending),
    ),
    ...foes.map((stack, index) =>
      fighterFromStack(stack, index, 'enemy', defending),
    ),
  ];
  game.battle = {
    site: siteId,
    units,
    round: 0,
    queue: [],
    waiting: [],
    obstacles: [
      { q: 8, r: 5 },
      { q: 8, r: 6 },
      { q: 6, r: 2 },
      { q: 10, r: 8 },
    ],
    active: '',
    result: null,
  };
  if (place.kind === 'castle' || place.kind === 'fortress') {
    game.battle.siege = { wallHp: 180, maxWallHp: 180 };
  }
  nextTurn(game);
  appendLog(game, `${battleOpeningLabel(game)} : ${place.name}.`);
}

function retreatPosition(game: GameState): Hex {
  const town = SITES.find(
    (site) => site.kind === 'castle' && game.owned.includes(site.id),
  );
  if (town) {
    return { q: town.q, r: town.r };
  }
  const home = SITES[0];
  const tile = WALKABLE.filter(
    (walkTile) =>
      !game.enemyHeroes?.some((enemy) => key(enemy) === key(walkTile)),
  ).sort((tileA, tileB) => {
    if (!home) {
      return 0;
    }
    return distance(tileA, home) - distance(tileB, home);
  })[0];
  if (!tile) {
    return { q: 0, r: 0 };
  }
  return { q: tile.q, r: tile.r };
}

function loseTown(game: GameState, townId: string) {
  game.owned = game.owned.filter((ownedId) => ownedId !== townId);
  game.cleared = game.cleared.filter((clearedId) => clearedId !== townId);
  game.enemyOwned = [...new Set([...(game.enemyOwned ?? []), townId])];
  if (game.garrisons) {
    delete game.garrisons[townId];
  }
  appendLog(
    game,
    `${SITES.find((site) => site.id === townId)!.name} passe sous la bannière adverse. Vous pouvez le reconquérir.`,
  );
}

function opponentBattleSiteId(
  game: GameState,
  hero: OpponentHero,
  town?: string,
): string {
  if (town) {
    return town;
  }
  const capture = SITES.find(
    (site) =>
      site.kind === 'castle' &&
      !game.owned.includes(site.id) &&
      key(site) === key(hero),
  );
  if (capture) {
    return capture.id;
  }
  return 'army1';
}

function opponentBattleLog(heroName: string, town?: string): string {
  if (town) {
    const townSite = SITES.find((site) => site.id === town)!;
    return `${heroName} assiège ${townSite.name} !`;
  }
  return `${heroName} attaque votre héros !`;
}

function startOpponentBattle(
  game: GameState,
  hero: OpponentHero,
  town?: string,
) {
  let captureTown: string | undefined;
  if (!town) {
    captureTown = SITES.find(
      (site) =>
        site.kind === 'castle' &&
        !game.owned.includes(site.id) &&
        key(site) === key(hero),
    )?.id;
  }
  let remote = false;
  if (town) {
    const siegeSite = SITES.find((site) => site.id === town)!;
    remote = key(game.hero) !== key(siegeSite);
  }
  let garrison: Stack[] | undefined;
  if (town) {
    garrison = game.garrisons?.[town] ?? defaultGarrison(game);
  }
  let battleAllies: Stack[] | undefined;
  if (remote) {
    battleAllies = garrison;
  }
  startBattle(
    game,
    opponentBattleSiteId(game, hero, town),
    hero.army,
    battleAllies,
    Boolean(town),
  );
  let armyBackup: Stack[] | undefined;
  if (remote) {
    armyBackup = structuredClone(game.army);
  }
  game.battle!.opponent = {
    hero: hero.id,
    town,
    captureTown,
    armyBackup,
  };
  appendLog(game, opponentBattleLog(hero.name, town));
}

/** Continue the persisted enemy queue after a defended battle; each leader acts once. */
// eslint-disable-next-line sonarjs/cognitive-complexity -- file IA adverse
function playOpponents(game: GameState) {
  while (!game.battle && game.enemyQueue?.length) {
    const heroId = game.enemyQueue.shift()!;
    const hero = game.enemyHeroes?.find((opponent) => opponent.id === heroId);
    if (!hero) {
      continue;
    }
    const path = opponentRoute(game, hero);
    for (const step of path) {
      hero.q = step.q;
      hero.r = step.r;
      const town = SITES.find(
        (site) =>
          site.kind === 'castle' &&
          game.owned.includes(site.id) &&
          key(site) === key(hero),
      );
      if (town) {
        startOpponentBattle(game, hero, town.id);
        break;
      }
      if (key(hero) === key(game.hero)) {
        startOpponentBattle(game, hero);
        break;
      }
      const resource = SITES.find(
        (site) =>
          ['gold', 'crystal'].includes(site.kind) && key(site) === key(hero),
      );
      if (resource && !game.enemyOwned?.includes(resource.id)) {
        game.owned = game.owned.filter((ownedId) => ownedId !== resource.id);
        game.enemyOwned ??= [];
        game.enemyOwned.push(resource.id);
        appendLog(game, `${hero.name} capture ${resource.name}.`);
      }
    }
    if (!path.length) {
      const town = SITES.find(
        (site) =>
          site.kind === 'castle' &&
          game.owned.includes(site.id) &&
          key(site) === key(hero),
      );
      if (town) {
        startOpponentBattle(game, hero, town.id);
      } else if (key(hero) === key(game.hero)) {
        startOpponentBattle(game, hero);
      }
    }
    if (path.length && !game.battle) {
      appendLog(game, `${hero.name} avance de ${path.length} case(s).`);
    }
  }
  if (!game.battle) {
    appendLog(
      game,
      `Le tour adverse est terminé. À vous de jouer, jour ${game.day}.`,
    );
  }
}

function endOpponentDay(game: GameState) {
  game.enemyHeroes ??= initialOpponents();
  game.enemyOwned ??= ['shade-castle', 'dawn-castle', 'boss'].filter(
    (siteId) => !game.owned.includes(siteId),
  );
  const enemyCastles = game.enemyOwned.filter((siteId) =>
    SITES.some((site) => site.id === siteId && site.kind === 'castle'),
  ).length;
  game.enemyGold =
    (game.enemyGold ?? 450) +
    150 +
    enemyGoldMineBonus(game) +
    enemyCastles * 150;
  game.enemyCrystals = (game.enemyCrystals ?? 8) + enemyCrystalIncome(game);
  if ((game.day - 1) % 7 === 0) {
    for (const hero of game.enemyHeroes) {
      if (game.enemyGold >= 180) {
        game.enemyGold -= 180;
        hero.army.forEach((stack, index) => {
          stack.count += enemyRecruitIncrement(index);
        });
      }
    }
  }
  game.enemyQueue = game.enemyHeroes.map((opponent) => opponent.id);
  playOpponents(game);
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- résolution de siège
function settleOpponentBattle(
  game: GameState,
  victory: boolean,
  retreat = false,
) {
  const battle = game.battle!;
  const encounter = battle.opponent!;
  const hero = game.enemyHeroes?.find(
    (opponent) => opponent.id === encounter.hero,
  );
  const survivors = (side: 'ally' | 'enemy') =>
    battle.units
      .filter((unit) => unit.side === side && unit.hp > 0)
      .map((unit) => ({
        id: unit.id,
        creature: unit.creature,
        count: survivorStackCount(unit, retreat, side),
        xp: survivorStackXp(unit, victory, side),
      }));
  if (encounter.armyBackup) {
    game.army = encounter.armyBackup;
    if (victory && encounter.town) {
      game.garrisons ??= {};
      game.garrisons[encounter.town] = survivors('ally');
    }
  } else {
    game.army = survivors('ally');
  }
  if (victory) {
    if (encounter.captureTown) {
      if (!game.owned.includes(encounter.captureTown)) {
        game.owned.push(encounter.captureTown);
      }
      game.enemyOwned = game.enemyOwned?.filter(
        (siteId) => siteId !== encounter.captureTown,
      );
      if (
        SITES.some(
          (site) => site.id === encounter.captureTown && site.difficulty > 0,
        ) &&
        !game.cleared.includes(encounter.captureTown)
      ) {
        game.cleared.push(encounter.captureTown);
      }
    }
    game.enemyHeroes = (game.enemyHeroes ?? []).filter(
      (opponent) => opponent.id !== encounter.hero,
    );
    game.gold += 300;
    game.crystals += 4;
    appendLog(
      game,
      `${defeatedHeroName(hero?.name)} est vaincu. +300 or, +4 cristaux.`,
    );
    const resource = SITES.find(
      (site) =>
        key(site) === key(game.hero) && ['gold', 'crystal'].includes(site.kind),
    );
    if (resource) {
      if (!game.owned.includes(resource.id)) {
        game.owned.push(resource.id);
      }
      game.enemyOwned = game.enemyOwned?.filter(
        (siteId) => siteId !== resource.id,
      );
    }
  } else {
    if (hero) {
      hero.army = survivors('enemy');
    }
    if (encounter.town) {
      loseTown(game, encounter.town);
    }
    if (!encounter.armyBackup) {
      game.hero = retreatPosition(game);
      game.movement = 0;
      if (!game.army.length) {
        game.army = newGame().army.map((stack) => ({ ...stack, count: 3 }));
      }
    }
  }
  game.battle = null;
  revealExplored(game);
  if (!retreat) {
    playOpponents(game);
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity -- reducer principal
export function reduce(state: GameState, action: Action): GameState {
  const game: GameState = structuredClone(state);
  if (game.won) {
    return state;
  }
  if (!game.battle) {
    if (action.type === 'move') {
      let path = pathTo(game.hero, action.to, WALKABLE);
      const intercept = path.findIndex(
        (step) =>
          SITES.some(
            (site) =>
              site.kind === 'army' &&
              key(site) === key(step) &&
              !game.cleared.includes(site.id),
          ) || game.enemyHeroes?.some((enemy) => key(enemy) === key(step)),
      );
      if (intercept >= 0) {
        path = path.slice(0, intercept + 1);
      }
      if (
        !path.length ||
        path.length > game.movement ||
        !game.explored.includes(key(action.to))
      ) {
        return state;
      }
      const destination = path.at(-1);
      if (!destination) {
        return state;
      }
      game.hero = { ...destination };
      game.movement -= path.length;
      revealExplored(game);
      const site = SITES.find((place) => key(place) === key(game.hero));
      const foe = game.enemyHeroes?.find(
        (enemy) => key(enemy) === key(game.hero),
      );
      if (foe) {
        startOpponentBattle(game, foe);
        return game;
      }
      if (
        site &&
        ['gold', 'crystal'].includes(site.kind) &&
        !game.owned.includes(site.id)
      ) {
        game.owned.push(site.id);
        game.enemyOwned = game.enemyOwned?.filter(
          (siteId) => siteId !== site.id,
        );
        appendLog(game, `${site.name} rejoint votre royaume.`);
      }
      if (site?.kind === 'army' && !game.cleared.includes(site.id)) {
        startBattle(game, site.id);
      }
      if (site?.kind === 'shrine') {
        game.mana = maxMana(game);
        appendLog(
          game,
          'La source restaure votre mana. ' +
            'Votre armée sera en pleine forme au prochain combat.',
        );
      }
    } else if (action.type === 'end-day') {
      game.day++;
      game.gold += income(game);
      game.crystals += crystalIncomePerDay(game);
      game.movement = maxMovement(game);
      game.mana = Math.min(maxMana(game), game.mana + 4);
      game.recruited = 0;
      if ((game.day - 1) % 7 === 0) {
        game.available = {
          sylve: recruitStock(game, 'sylve'),
          sol: recruitStock(game, 'sol'),
        };
        for (const family of ['sylve', 'sol'] as const) {
          if (builtBuildings(game).includes(family)) {
            game.available[family] += weeklyGrowth(game, family);
          }
        }
        appendLog(
          game,
          `Semaine ${Math.ceil(game.day / 7)} : de nouvelles créatures sont disponibles dans les habitations.`,
        );
      }
      appendLog(
        game,
        `Jour ${game.day} : +${income(game)} or. Vos déplacements sont restaurés.`,
      );
      endOpponentDay(game);
    } else if (action.type === 'recruit') {
      if (
        !friendlyTown(game) ||
        recruitStock(game, action.family) < 3 ||
        !builtBuildings(game).includes(action.family)
      ) {
        return state;
      }
      const familyCreature = getCreature(action.family);
      const cost = familyCreature.gold * 3;
      if (game.gold < cost) {
        return state;
      }
      game.gold -= cost;
      game.recruited++;
      game.available = {
        sylve: recruitStock(game, 'sylve'),
        sol: recruitStock(game, 'sol'),
      };
      game.available[action.family] -= 3;
      const unit = game.army.find(
        (stack) => getCreature(stack.creature).family === action.family,
      );
      // Recruits inherit the army's trained form; evolution is an army-wide upgrade.
      if (unit) {
        unit.count += 3;
      } else {
        game.army.push({
          id: `army-${action.family}`,
          creature: action.family,
          count: 3,
          xp: 0,
        });
      }
      appendLog(
        game,
        `3 ${recruitLogCreatureName(unit, familyCreature.name)} rejoignent votre armée.`,
      );
    } else if (action.type === 'evolve') {
      const unit = game.army.find((stack) => stack.id === action.id);
      if (!Object.hasOwn(CREATURES, action.creature)) {
        return state;
      }
      const evolution = getCreature(action.creature);
      if (
        !unit ||
        !getCreature(unit.creature).evolves.includes(evolution.id) ||
        unit.xp < evolution.xp ||
        game.gold < evolution.gold ||
        game.crystals < evolution.crystals
      ) {
        return state;
      }
      game.gold -= evolution.gold;
      game.crystals -= evolution.crystals;
      unit.creature = evolution.id;
      appendLog(
        game,
        `Évolution : ${evolution.name} ! Toute la troupe change de forme.`,
      );
    } else if (action.type === 'build') {
      if (
        !game.owned.includes('home') ||
        !SITES[0] ||
        key(game.hero) !== key(SITES[0]) ||
        constructionStatus(game, action.building)
      ) {
        return state;
      }
      const building = BUILDINGS.find((entry) => entry.id === action.building)!;
      game.gold -= building.gold;
      game.crystals -= building.crystals;
      game.built = [...builtBuildings(game), building.id];
      game.buildDay = game.day;
      if (building.id === 'sol') {
        game.available = { sylve: recruitStock(game, 'sylve'), sol: 9 };
      }
      if (building.id === 'guild') {
        game.mana = maxMana(game);
      }
      appendLog(
        game,
        `${building.name} construit. Prochain chantier : demain.`,
      );
    } else if (action.type === 'upgrade') {
      const cost = game.castle * 550;
      if (
        !game.owned.includes('home') ||
        !SITES[0] ||
        key(game.hero) !== key(SITES[0]) ||
        game.castle >= 3 ||
        game.gold < cost ||
        game.crystals < 5 ||
        game.buildDay === game.day ||
        !builtBuildings(game).includes(upgradeRequiredBuilding(game.castle))
      ) {
        return state;
      }
      game.gold -= cost;
      game.crystals -= 5;
      game.castle++;
      game.buildDay = game.day;
      game.movement++;
      game.mana = Math.min(maxMana(game), game.mana + 2);
      appendLog(
        game,
        `Citadelle niveau ${game.castle} : davantage de revenus, de mana et de déplacements.`,
      );
    } else if (action.type === 'fight-hero') {
      const hero = game.enemyHeroes?.find(
        (opponent) =>
          opponent.id === action.hero && key(opponent) === key(game.hero),
      );
      if (!hero) {
        return state;
      }
      startOpponentBattle(game, hero);
    } else if (action.type === 'fight') {
      const site = SITES.find((place) => place.id === action.site);
      if (
        !site ||
        (!site.difficulty && !game.enemyOwned?.includes(site.id)) ||
        key(site) !== key(game.hero) ||
        game.cleared.includes(site.id) ||
        !game.army.length ||
        (site.id === 'boss' &&
          (!game.cleared.includes('camp1') || !game.cleared.includes('camp2')))
      ) {
        return state;
      }
      startBattle(game, site.id);
    } else {
      return state;
    }
    return game;
  }
  const battle = game.battle;
  const activeFighter = activeUnit(game);
  if (action.type === 'finish-battle' && battle.result) {
    if (battle.opponent) {
      settleOpponentBattle(game, battle.result === 'victory');
      return game;
    }
    const victory = battle.result === 'victory';
    const site = SITES.find((place) => place.id === battle.site)!;
    game.army = battle.units
      .filter((unit) => unit.side === 'ally' && unit.hp > 0)
      .map((unit) => ({
        id: unit.id,
        creature: unit.creature,
        count: unitCount(unit),
        xp: unit.xp + adventureBattleXp(victory, site.difficulty),
      }));
    if (victory) {
      if (site.difficulty > 0 && !game.cleared.includes(battle.site)) {
        game.cleared.push(battle.site);
      }
      game.enemyOwned = game.enemyOwned?.filter(
        (siteId) => siteId !== battle.site,
      );
      if (site.kind === 'castle' || site.kind === 'fortress') {
        if (!game.owned.includes(site.id)) {
          game.owned.push(site.id);
        }
      }
      game.gold += adventureVictoryGold(site.difficulty);
      game.crystals += adventureVictoryCrystals(site.difficulty);
      appendLog(game, `Victoire ! ${site.name} est libéré.`);
      if (battle.site === 'boss') {
        game.won = true;
      }
    } else {
      game.hero = retreatPosition(game);
      if (!game.army.length) {
        game.army = [
          { id: 'army-sylve', creature: 'sylve', count: 4, xp: 0 },
          { id: 'army-sol', creature: 'sol', count: 3, xp: 0 },
        ];
      }
      appendLog(
        game,
        'Votre héros se replie en lieu sûr. ' +
          'Une petite troupe vous attend pour repartir.',
      );
    }
    game.battle = null;
    return game;
  }
  if (action.type === 'retreat' && !battle.result) {
    if (battle.opponent) {
      settleOpponentBattle(game, false, true);
      return game;
    }
    game.army = battle.units
      .filter((unit) => unit.side === 'ally' && unit.hp > 0)
      .map((unit) => ({
        id: unit.id,
        creature: unit.creature,
        count: Math.max(1, Math.floor(unitCount(unit) * 0.8)),
        xp: unit.xp,
      }));
    if (!game.army.length) {
      game.army = newGame().army;
    }
    game.hero = retreatPosition(game);
    game.movement = 0;
    game.battle = null;
    appendLog(game, 'Retraite en lieu sûr : 20 % de votre troupe est perdue.');
    return game;
  }
  if (!activeFighter || battle.result) {
    return state;
  }
  if (action.type === 'enemy' && activeFighter.side === 'enemy') {
    if (battle.opponent?.town && battle.siege?.wallHp) {
      battle.siege.wallHp = Math.max(0, battle.siege.wallHp - 70);
      appendLog(
        game,
        `La catapulte adverse frappe vos remparts : ${battle.siege.wallHp}/180 PV.`,
      );
      nextTurn(game);
      return game;
    }
    const targets = battle.units
      .filter((unit) => unit.side === 'ally' && unit.hp > 0)
      .sort(
        (left, right) =>
          battleDistance(activeFighter, left) -
            battleDistance(activeFighter, right) || left.hp - right.hp,
      );
    const target = targets.find((unit) => attackPosition(game, unit));
    if (target) {
      const pos = attackPosition(game, target)!;
      activeFighter.q = pos.q;
      activeFighter.r = pos.r;
      strike(game, activeFighter, target);
    } else {
      const primaryTarget = targets[0];
      const moves = reachable(game).sort((left, right) => {
        if (!primaryTarget) {
          return 0;
        }
        return (
          battleDistance(left, primaryTarget) -
          battleDistance(right, primaryTarget)
        );
      });
      const step = moves[0];
      if (step) {
        activeFighter.q = step.q;
        activeFighter.r = step.r;
        appendLog(
          game,
          `${getCreature(activeFighter.creature).name} avance.`,
        );
      } else {
        activeFighter.defending = true;
      }
    }
    activeFighter.slowed = false;
    nextTurn(game);
    return game;
  }
  if (activeFighter.side !== 'ally') {
    return state;
  }
  if (action.type === 'attack') {
    const target = battle.units.find((unit) => unit.id === action.target);
    if (!target) {
      return state;
    }
    let pos: Hex | null = action.from ?? null;
    pos ??= attackPosition(game, target);
    if (
      !pos ||
      (key(pos) !== key(activeFighter) &&
        !reachable(game).some((tile) => key(tile) === key(pos)))
    ) {
      return state;
    }
    activeFighter.q = pos.q;
    activeFighter.r = pos.r;
    if (!canAttack(activeFighter, target, battle.units)) {
      return state;
    }
    strike(game, activeFighter, target);
  } else if (action.type === 'battle-move') {
    if (!reachable(game).some((tile) => key(tile) === key(action.to))) {
      return state;
    }
    activeFighter.q = action.to.q;
    activeFighter.r = action.to.r;
    appendLog(
      game,
      `${getCreature(activeFighter.creature).name} se déplace.`,
    );
  } else if (action.type === 'catapult') {
    if (!battle.siege || battle.siege.wallHp === 0 || battle.opponent?.town) {
      return state;
    }
    battle.siege.wallHp = Math.max(0, battle.siege.wallHp - 70);
    appendLog(game, catapultLogMessage(battle.siege.wallHp));
  } else if (action.type === 'wait') {
    if (activeFighter.waited) {
      return state;
    }
    activeFighter.waited = true;
    battle.waiting ??= [];
    battle.waiting.push(activeFighter.id);
    appendLog(
      game,
      `${getCreature(activeFighter.creature).name} attend la fin du tour.`,
    );
  } else if (action.type === 'defend') {
    activeFighter.defending = true;
    appendLog(
      game,
      `${getCreature(activeFighter.creature).name} se protège jusqu’à son prochain tour.`,
    );
  } else if (action.type === 'spell') {
    if (
      game.mana < 4 ||
      battle.spellRound === battle.round ||
      battle.opponent?.armyBackup
    ) {
      return state;
    }
    const target = battle.units.find(
      (unit) => unit.id === action.target && unit.hp > 0,
    );
    if (!target) {
      return state;
    }
    if (action.spell === 'bolt' && target.side === 'enemy') {
      target.hp = Math.max(0, target.hp - 70 - game.castle * 15);
      appendLog(game, 'Éclair astral ! La cible est frappée par votre magie.');
    } else if (action.spell === 'heal' && target.side === 'ally') {
      target.hp = Math.min(target.maxHp, target.hp + 80 + game.castle * 20);
      appendLog(game, 'Souffle de vie : la troupe récupère ses points de vie.');
    } else {
      return state;
    }
    game.mana -= 4;
    battle.spellRound = battle.round;
    updateResult(game);
    return game;
  } else {
    return state;
  }
  activeFighter.slowed = false;
  nextTurn(game);
  return game;
}
