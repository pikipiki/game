import { describe, expect, it } from 'vitest';
import { SITES, battleDistance, distance, key } from '@/game/data';
import {
  activeUnit,
  attackPosition,
  income,
  loadGame,
  newGame,
  reachable,
  reduce,
  type GameState,
} from '@/game/engine';
import { battleTitle, opponentRoute } from '@/game/opponent';
import { animationPlan } from '@/game/battle/animation';

const ACTION_FINISH_BATTLE = 'finish-battle' as const;

function loneOpponent(state: GameState, hexQ: number, hexR: number) {
  const lead = state.enemyHeroes![0]!;
  state.enemyHeroes = [{ ...lead, q: hexQ, r: hexR }];
  return state;
}

function siegeScenario() {
  const state = loneOpponent(newGame(), -2, 2);
  state.hero = { q: 3, r: -3 };
  state.enemyOwned!.push('gold', 'crystal');
  return reduce(state, { type: 'end-day' });
}

function battleMoveOrDefend(state: GameState): GameState {
  const enemies = state.battle!.units.filter(
    (unit) => unit.side === 'enemy' && unit.hp > 0,
  );
  const moves = reachable(state).sort(
    (left, right) =>
      Math.min(...enemies.map((enemy) => battleDistance(left, enemy))) -
      Math.min(...enemies.map((enemy) => battleDistance(right, enemy))),
  );
  if (moves.length > 0) {
    return reduce(state, { type: 'battle-move', to: moves[0]! });
  }
  return reduce(state, { type: 'defend' });
}

function resolveBattle(start: GameState) {
  let state = start;
  for (let turn = 0; turn < 300 && !state.battle!.result; turn++) {
    const actor = activeUnit(state)!;
    if (actor.side === 'enemy') {
      state = reduce(state, { type: 'enemy' });
      continue;
    }
    const enemies = state.battle!.units.filter(
      (unit) => unit.side === 'enemy' && unit.hp > 0,
    );
    const target = enemies
      .filter((unit) => attackPosition(state, unit))
      .sort((left, right) => left.hp - right.hp)[0];
    if (target) state = reduce(state, { type: 'attack', target: target.id });
    else state = battleMoveOrDefend(state);
  }
  expect(state.battle!.result).not.toBeNull();
  return state;
}

describe('Tour stratégique adverse automatique', () => {
  it(
    'déplace tous les héros après la fin du jour, avec leurs deux pas',
    () => {
    const state = newGame(),
      next = reduce(state, { type: 'end-day' });
    expect(next.day).toBe(2);
    expect(next.enemyQueue).toEqual([]);
    next.enemyHeroes!.forEach((hero, index) => {
      expect(key(hero)).not.toBe(key(state.enemyHeroes![index]!));
      expect(distance(hero, state.enemyHeroes![index]!)).toBeLessThanOrEqual(2);
    });
    expect(state.day).toBe(1);
  });
  it(
    'capture une ressource alliée et en supprime les revenus suivants',
    () => {
    const state = loneOpponent(newGame(), -1, 0);
    state.hero = { q: 3, r: -3 };
    state.owned.push('gold');
    state.enemyOwned!.push('crystal');
    const next = reduce(state, { type: 'end-day' });
    expect(next.enemyOwned).toContain('gold');
    expect(next.owned).not.toContain('gold');
    expect(income(next)).toBe(income(state) - 150);
    expect(next.log.some((line) => line.includes('capture Mine'))).toBe(true);
  });
  it(
    'engage automatiquement le héros à portée et bloque un deuxième jour',
    () => {
    const state = loneOpponent(newGame(), 1, 0);
    state.hero = { q: 0, r: 0 };
    const next = reduce(state, { type: 'end-day' });
    expect(next.battle?.opponent?.hero).toBe(state.enemyHeroes![0]!.id);
    expect(next.battle?.opponent?.town).toBeUndefined();
    expect(key(next.hero)).toBe(key(state.hero));
    expect(reduce(next, { type: 'end-day' })).toBe(next);
  });
  it(
    'engage le héros adverse déjà sur la case du joueur sans déplacement',
    () => {
    const state = loneOpponent(newGame(), 0, 0);
    state.hero = { q: 0, r: 0 };
    const next = reduce(state, { type: 'end-day' });
    expect(next.battle?.opponent?.hero).toBe(state.enemyHeroes![0]!.id);
  });
  it(
    'assiège une ville distante avec sa garnison et anime la catapulte adverse',
    () => {
    let state = siegeScenario();
    expect(state.battle?.opponent?.town).toBe('home');
    expect(state.battle?.opponent?.armyBackup).toEqual(newGame().army);
    expect(
      state.battle?.units
        .filter((unit) => unit.side === 'ally')
        .every((unit) => unit.q === 16),
    ).toBe(true);
    while (activeUnit(state)!.side === 'ally') {
      state = reduce(state, { type: 'defend' });
    }
    const next = reduce(state, { type: 'enemy' });
    expect(next.battle?.siege?.wallHp).toBe(110);
    expect(animationPlan(state, next, { type: 'enemy' })?.kind).toBe(
      'catapult',
    );
    expect(loadGame(JSON.stringify(next))).toEqual(next);
  });
  it(
    'conserve l’armée et la position du héros quand une garnison gagne',
    () => {
    const start = siegeScenario();
    const finished = resolveBattle(start);
    expect(finished.battle!.result).toBe('victory');
    const next = reduce(finished, { type: ACTION_FINISH_BATTLE });
    expect(next.battle).toBeNull();
    expect(next.army).toEqual(start.army);
    expect(next.hero).toEqual(start.hero);
    expect(next.owned).toContain('home');
    expect(next.enemyHeroes).toEqual([]);
    expect(next.garrisons!.home!.length).toBeGreaterThan(0);
    expect(loadGame(JSON.stringify(next))).toEqual(next);
  });
  it(
    'perd une ville abandonnée et permet de la reconquérir au siège',
    () => {
    const start = siegeScenario(),
      lost = reduce(start, { type: 'retreat' });
    expect(lost.army).toEqual(start.army);
    expect(lost.hero).toEqual(start.hero);
    expect(lost.owned).not.toContain('home');
    expect(lost.enemyOwned).toContain('home');
    expect(income(lost)).toBe(0);
    const capital = SITES[0]!;
    lost.hero = { q: capital.q, r: capital.r };
    const attack = reduce(lost, {
      type: 'fight-hero',
      hero: lost.enemyHeroes![0]!.id,
    });
    expect(attack.battle?.opponent?.captureTown).toBe('home');
    expect(attack.battle?.siege?.wallHp).toBe(180);
    expect(loadGame(JSON.stringify(attack))).toEqual(attack);
  });
  it(
    'reprend automatiquement le reste de l’équipe après une défense',
    () => {
    const state = siegeScenario();
    const second = newGame().enemyHeroes![1]!;
    state.enemyHeroes!.push({ ...second, q: 3, r: 0 });
    state.enemyQueue = ['enemy-dawn'];
    const before = key(state.enemyHeroes![1]!);
    const finished = resolveBattle(state),
      next = reduce(finished, { type: ACTION_FINISH_BATTLE });
    expect(
      next.enemyHeroes!.find((hero) => hero.id === 'enemy-dusk'),
    ).toBeUndefined();
    expect(key(next.enemyHeroes![0]!)).not.toBe(before);
    expect(next.enemyQueue).toEqual([]);
    expect(next.day).toBe(state.day);
  });
  it(
    'priorise les routes stratégiques et les duels proches du héros',
    () => {
    const state = loneOpponent(newGame(), 2, -2);
    state.hero = { q: 0, r: -2 };
    const route = opponentRoute(state, state.enemyHeroes![0]!);
    expect(route.length).toBeLessThanOrEqual(2);
    expect(
      opponentRoute(state, { ...state.enemyHeroes![0]!, q: 99, r: 99 }),
    ).toEqual([]);
    expect(battleTitle({ ...state, battle: null })).toBe('');
    state.battle = {
      site: 'camp1',
      round: 1,
      active: 'army-sylve',
      queue: [],
      units: [],
      result: null,
      spellRound: 0,
    };
    expect(battleTitle(state)).toBe('Clairière oubliée');
    state.battle!.opponent = { hero: 'missing' };
    expect(battleTitle(state)).toContain('adversaire');
  });
  it(
    'défend la citadelle quand un héros adverse y termine son tour sans bouger',
    () => {
    const home = SITES.find((place) => place.id === 'home')!;
    const state = newGame();
    const lead = newGame().enemyHeroes![0]!;
    state.enemyHeroes = [{ ...lead, q: home.q, r: home.r }];
    state.enemyQueue = [state.enemyHeroes![0]!.id];
    const next = reduce(state, { type: 'end-day' });
    expect(next.battle?.opponent?.town).toBe('home');
  });
  it(
    'renforce les armées adverses au début de semaine quand l’or le permet',
    () => {
    let state = newGame();
    state.day = 7;
    state.enemyGold = 600;
    const before = state.enemyHeroes![0]!.army[0]!.count;
    state = reduce(state, { type: 'end-day' });
    expect(state.enemyHeroes![0]!.army[0]!.count).toBe(before + 2);
  });
  it(
    'résout une défaite contre un héros et une victoire sur une ressource',
    () => {
    const gold = SITES.find((place) => place.id === 'gold')!;
    let state = loneOpponent(newGame(), gold.q, gold.r);
    state.hero = { q: gold.q, r: gold.r };
    const foeId = state.enemyHeroes![0]!.id;
    state = reduce(state, { type: 'fight-hero', hero: foeId });
    state.battle!.result = 'victory';
    state.battle!.units
      .filter((unit) => unit.side === 'enemy')
      .forEach((unit) => {
        unit.hp = 0;
      });
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(state.owned).toContain('gold');
    let siege = loneOpponent(newGame(), -2, -1);
    siege.hero = { q: -2, r: -1 };
    siege = reduce(siege, {
      type: 'fight-hero',
      hero: siege.enemyHeroes![0]!.id,
    });
    siege.battle!.opponent!.captureTown = 'shade-castle';
    siege.battle!.result = 'victory';
    siege.battle!.units
      .filter((unit) => unit.side === 'enemy')
      .forEach((unit) => {
        unit.hp = 0;
      });
    siege = reduce(siege, { type: ACTION_FINISH_BATTLE });
    expect(siege.owned).toContain('shade-castle');
    expect(siege.cleared).toContain('shade-castle');
    state = loneOpponent(newGame(), 0, 0);
    state.hero = { q: 0, r: 0 };
    state = reduce(state, {
      type: 'fight-hero',
      hero: state.enemyHeroes![0]!.id,
    });
    state.battle!.result = 'defeat';
    state.battle!.units
      .filter((unit) => unit.side === 'ally')
      .forEach((unit) => {
        unit.hp = 0;
      });
    state.army = [];
    const lost = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(lost.battle).toBeNull();
    expect(lost.army.length).toBeGreaterThan(0);
    expect(lost.movement).toBe(0);
  });
  it(
    'nomme les batailles selon le contexte de l’affrontement',
    () => {
    expect(battleTitle(newGame())).toBe('');
    let state = newGame();
    state.hero = { q: -1, r: -2 };
    state = reduce(state, { type: 'fight', site: 'camp1' });
    expect(battleTitle(state)).toBe('Clairière oubliée');
    state.battle!.opponent = { hero: 'enemy-dusk', town: 'home' };
    expect(battleTitle(state)).toContain('Citadelle');
    state.battle!.opponent = { hero: 'enemy-dusk' };
    expect(battleTitle(state)).toContain('Noisette');
  });
  it(
    'renforce les armées à la nouvelle semaine et valide les sauvegardes',
    () => {
    const state = loneOpponent(newGame(), 3, -3);
    state.day = 7;
    const next = reduce(state, { type: 'end-day' });
    expect(next.enemyHeroes![0]!.army[0]!.count).toBe(
      state.enemyHeroes![0]!.army[0]!.count + 2,
    );
    expect(loadGame(JSON.stringify(next))).toEqual(next);
    expect(
      loadGame(JSON.stringify({ ...next, enemyQueue: ['inconnu'] })),
    ).toBeNull();
    expect(loadGame(JSON.stringify({ ...next, enemyGold: -1 }))).toBeNull();
    const old = newGame();
    delete old.enemyHeroes;
    delete old.enemyOwned;
    delete old.enemyQueue;
    expect(
      reduce(loadGame(JSON.stringify(old))!, { type: 'end-day' }).enemyHeroes,
    ).toHaveLength(2);
  });
});
