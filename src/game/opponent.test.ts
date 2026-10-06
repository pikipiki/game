import { describe, expect, it } from 'vitest';
import { SITES, battleDistance, distance, key } from './data';
import {
  activeUnit,
  attackPosition,
  income,
  loadGame,
  newGame,
  reachable,
  reduce,
  type GameState,
} from './engine';
import { animationPlan } from './battle-animation';

function loneOpponent(s: GameState, q: number, r: number) {
  s.enemyHeroes = [{ ...s.enemyHeroes![0], q, r }];
  return s;
}
function siegeScenario() {
  const s = loneOpponent(newGame(), -2, 2);
  s.hero = { q: 3, r: -3 };
  s.enemyOwned!.push('gold', 'crystal');
  return reduce(s, { type: 'end-day' });
}
function resolveBattle(start: GameState) {
  let s = start;
  for (let i = 0; i < 300 && !s.battle!.result; i++) {
    const a = activeUnit(s)!;
    if (a.side === 'enemy') {
      s = reduce(s, { type: 'enemy' });
      continue;
    }
    const enemies = s.battle!.units.filter((u) => u.side === 'enemy' && u.hp > 0);
    const target = enemies.filter((u) => attackPosition(s, u)).sort((a, b) => a.hp - b.hp)[0];
    if (target) s = reduce(s, { type: 'attack', target: target.id });
    else {
      const moves = reachable(s).sort(
        (a, b) =>
          Math.min(...enemies.map((e) => battleDistance(a, e))) -
          Math.min(...enemies.map((e) => battleDistance(b, e))),
      );
      s = reduce(s, moves.length ? { type: 'battle-move', to: moves[0] } : { type: 'defend' });
    }
  }
  expect(s.battle!.result).not.toBeNull();
  return s;
}

describe('Tour stratégique adverse automatique', () => {
  it('déplace tous les héros après la fin du jour, avec leurs deux pas et une file terminée', () => {
    const s = newGame(),
      next = reduce(s, { type: 'end-day' });
    expect(next.day).toBe(2);
    expect(next.enemyQueue).toEqual([]);
    next.enemyHeroes!.forEach((h, i) => {
      expect(key(h)).not.toBe(key(s.enemyHeroes![i]));
      expect(distance(h, s.enemyHeroes![i])).toBeLessThanOrEqual(2);
    });
    expect(s.day).toBe(1);
  });
  it('capture une ressource alliée et en supprime les revenus suivants', () => {
    const s = loneOpponent(newGame(), -1, 0);
    s.hero = { q: 3, r: -3 };
    s.owned.push('gold');
    s.enemyOwned!.push('crystal');
    const next = reduce(s, { type: 'end-day' });
    expect(next.enemyOwned).toContain('gold');
    expect(next.owned).not.toContain('gold');
    expect(income(next)).toBe(income(s) - 150);
    expect(next.log.some((line) => line.includes('capture Mine'))).toBe(true);
  });
  it('engage automatiquement le héros à portée et bloque un deuxième jour pendant la bataille', () => {
    const s = loneOpponent(newGame(), 1, 0);
    s.hero = { q: 0, r: 0 };
    const next = reduce(s, { type: 'end-day' });
    expect(next.battle?.opponent?.hero).toBe(s.enemyHeroes![0].id);
    expect(next.battle?.opponent?.town).toBeUndefined();
    expect(key(next.hero)).toBe(key(s.hero));
    expect(reduce(next, { type: 'end-day' })).toBe(next);
  });
  it('assiège une ville distante avec sa garnison et anime les tirs de la catapulte adverse', () => {
    let s = siegeScenario();
    expect(s.battle?.opponent?.town).toBe('home');
    expect(s.battle?.opponent?.armyBackup).toEqual(newGame().army);
    expect(s.battle?.units.filter((u) => u.side === 'ally').every((u) => u.q === 16)).toBe(true);
    while (activeUnit(s)!.side === 'ally') s = reduce(s, { type: 'defend' });
    const next = reduce(s, { type: 'enemy' });
    expect(next.battle?.siege?.wallHp).toBe(110);
    expect(animationPlan(s, next, { type: 'enemy' })?.kind).toBe('catapult');
    expect(loadGame(JSON.stringify(next))).toEqual(next);
  });
  it('conserve l’armée et la position du héros quand une garnison gagne sa défense', () => {
    const start = siegeScenario();
    const finished = resolveBattle(start);
    expect(finished.battle!.result).toBe('victory');
    const next = reduce(finished, { type: 'finish-battle' });
    expect(next.battle).toBeNull();
    expect(next.army).toEqual(start.army);
    expect(next.hero).toEqual(start.hero);
    expect(next.owned).toContain('home');
    expect(next.enemyHeroes).toEqual([]);
    expect(next.garrisons?.home.length).toBeGreaterThan(0);
    expect(loadGame(JSON.stringify(next))).toEqual(next);
  });
  it('perd une ville abandonnée et permet de reconquérir ce château avec un siège', () => {
    const start = siegeScenario(),
      lost = reduce(start, { type: 'retreat' });
    expect(lost.army).toEqual(start.army);
    expect(lost.hero).toEqual(start.hero);
    expect(lost.owned).not.toContain('home');
    expect(lost.enemyOwned).toContain('home');
    expect(income(lost)).toBe(0);
    lost.hero = { q: SITES[0].q, r: SITES[0].r };
    const attack = reduce(lost, { type: 'fight-hero', hero: lost.enemyHeroes![0].id });
    expect(attack.battle?.opponent?.captureTown).toBe('home');
    expect(attack.battle?.siege?.wallHp).toBe(180);
    expect(loadGame(JSON.stringify(attack))).toEqual(attack);
  });
  it('reprend automatiquement le reste de l’équipe après une défense sans rejouer le premier héros', () => {
    const s = siegeScenario();
    s.enemyHeroes!.push({ ...newGame().enemyHeroes![1], q: 3, r: 0 });
    s.enemyQueue = ['enemy-dawn'];
    const before = key(s.enemyHeroes![1]);
    const finished = resolveBattle(s),
      next = reduce(finished, { type: 'finish-battle' });
    expect(next.enemyHeroes!.find((h) => h.id === 'enemy-dusk')).toBeUndefined();
    expect(key(next.enemyHeroes![0])).not.toBe(before);
    expect(next.enemyQueue).toEqual([]);
    expect(next.day).toBe(s.day);
  });
  it('renforce les armées à la nouvelle semaine et valide les nouveaux champs de sauvegarde', () => {
    const s = loneOpponent(newGame(), 3, -3);
    s.day = 7;
    const next = reduce(s, { type: 'end-day' });
    expect(next.enemyHeroes![0].army[0].count).toBe(s.enemyHeroes![0].army[0].count + 2);
    expect(loadGame(JSON.stringify(next))).toEqual(next);
    expect(loadGame(JSON.stringify({ ...next, enemyQueue: ['inconnu'] }))).toBeNull();
    expect(loadGame(JSON.stringify({ ...next, enemyGold: -1 }))).toBeNull();
    const old = newGame();
    delete old.enemyHeroes;
    delete old.enemyOwned;
    delete old.enemyQueue;
    expect(reduce(loadGame(JSON.stringify(old))!, { type: 'end-day' }).enemyHeroes).toHaveLength(2);
  });
});
