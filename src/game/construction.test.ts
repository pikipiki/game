import { describe, expect, it } from 'vitest';
import { newGame, reduce, loadGame } from './engine';
import { INITIAL_BUILDINGS, builtBuildings } from './buildings';

describe('Construction progressive de la cité', () => {
  it('commence avec quatre bâtiments et trois véritables chantiers à construire', () => {
    const s = newGame();
    expect(builtBuildings(s)).toEqual(INITIAL_BUILDINGS);
    expect(reduce(s, { type: 'build', building: 'guild' })).toBe(s);
  });
  it('paie un chantier, débloque le recrutement et interdit un second bâtiment le même jour', () => {
    const s = newGame();
    expect(reduce(s, { type: 'recruit', family: 'sol' })).toBe(s);
    const built = reduce(s, { type: 'build', building: 'sol' });
    expect(built.gold).toBe(s.gold - 450);
    expect(built.crystals).toBe(s.crystals - 2);
    expect(builtBuildings(built)).toContain('sol');
    expect(reduce(built, { type: 'recruit', family: 'sol' }).army[1].count).toBe(9);
    expect(reduce(built, { type: 'build', building: 'guild' })).toBe(built);
    expect(reduce(built, { type: 'upgrade' })).toBe(built);
    const next = reduce(built, { type: 'end-day' });
    expect(builtBuildings(reduce(next, { type: 'build', building: 'guild' }))).toContain('guild');
  });
  it('réserve la tour ultime aux villes ayant construit l’atelier et un nouveau jour', () => {
    let s = newGame();
    s.enemyHeroes = []; // Isolate building and weekly-stock rules from attack scenarios.
    s.gold = 10000;
    s.crystals = 100;
    s = reduce(s, { type: 'upgrade' });
    s = reduce(s, { type: 'end-day' });
    expect(reduce(s, { type: 'upgrade' })).toBe(s);
    for (const building of ['sol', 'guild', 'forge'] as const) {
      s = reduce(s, { type: 'build', building });
      s = reduce(s, { type: 'end-day' });
    }
    expect(reduce(s, { type: 'upgrade' }).castle).toBe(3);
  });
  it('accumule les recrues au début de semaine sans réinitialiser le stock chaque jour', () => {
    let s = newGame();
    s.enemyHeroes = []; // Isolate building and weekly-stock rules from attack scenarios.
    s.gold = 10000;
    s = reduce(s, { type: 'recruit', family: 'sylve' });
    expect(s.available?.sylve).toBe(9);
    for (let i = 0; i < 6; i++) s = reduce(s, { type: 'end-day' });
    expect(s.day).toBe(7);
    expect(s.available?.sylve).toBe(9);
    s = reduce(s, { type: 'end-day' });
    expect(s.available?.sylve).toBe(15);
    expect(s.available?.sol).toBe(0);
  });
  it('préserve les bâtiments des anciennes sauvegardes et rejette les champs invalides', () => {
    const old = newGame();
    delete old.built;
    delete old.buildDay;
    expect(builtBuildings(loadGame(JSON.stringify(old))!)).toHaveLength(7);
    expect(loadGame(JSON.stringify({ ...newGame(), built: ['keep', 'pirate'] }))).toBeNull();
    expect(loadGame(JSON.stringify({ ...newGame(), buildDay: 99 }))).toBeNull();
  });
});
