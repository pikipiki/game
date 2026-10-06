import { describe, expect, it } from 'vitest';
import { newGame, reduce, loadGame } from '@/game/engine';
import {
  INITIAL_BUILDINGS,
  builtBuildings,
  constructionStatus,
  type BuildingId,
} from '@/game/buildings';

describe('Construction progressive de la cité', () => {
  it(
    'commence avec quatre bâtiments et trois chantiers à construire',
    () => {
    const state = newGame();
    expect(builtBuildings(state)).toEqual(INITIAL_BUILDINGS);
    expect(reduce(state, { type: 'build', building: 'guild' })).toBe(state);
  });
  it(
    'paie un chantier, débloque le recrutement et interdit un second bâtiment',
    () => {
    const state = newGame();
    expect(reduce(state, { type: 'recruit', family: 'sol' })).toBe(state);
    const built = reduce(state, { type: 'build', building: 'sol' });
    expect(built.gold).toBe(state.gold - 450);
    expect(built.crystals).toBe(state.crystals - 2);
    expect(builtBuildings(built)).toContain('sol');
    const recruitLine = reduce(built, { type: 'recruit', family: 'sol' });
    expect(recruitLine.army[1]!.count).toBe(9);
    expect(reduce(built, { type: 'build', building: 'guild' })).toBe(built);
    expect(reduce(built, { type: 'upgrade' })).toBe(built);
    const next = reduce(built, { type: 'end-day' });
    expect(
      builtBuildings(reduce(next, { type: 'build', building: 'guild' })),
    ).toContain('guild');
  });
  it(
    'réserve la tour ultime aux villes ayant construit l’atelier',
    () => {
    let state = newGame();
    state.enemyHeroes = [];
    state.gold = 10000;
    state.crystals = 100;
    state = reduce(state, { type: 'upgrade' });
    state = reduce(state, { type: 'end-day' });
    expect(reduce(state, { type: 'upgrade' })).toBe(state);
    for (const building of ['sol', 'guild', 'forge'] as const) {
      state = reduce(state, { type: 'build', building });
      state = reduce(state, { type: 'end-day' });
    }
    expect(reduce(state, { type: 'upgrade' }).castle).toBe(3);
  });
  it(
    'accumule les recrues au début de semaine sans réinitialiser le stock',
    () => {
    let state = newGame();
    state.enemyHeroes = [];
    state.gold = 10000;
    state = reduce(state, { type: 'recruit', family: 'sylve' });
    expect(state.available?.sylve).toBe(9);
    for (let day = 0; day < 6; day++) {
      state = reduce(state, { type: 'end-day' });
    }
    expect(state.day).toBe(7);
    expect(state.available?.sylve).toBe(9);
    state = reduce(state, { type: 'end-day' });
    expect(state.available?.sylve).toBe(15);
    expect(state.available?.sol).toBe(0);
  });
  it('explique pourquoi un chantier est bloqué', () => {
    const state = newGame();
    expect(constructionStatus(state, 'pirate' as BuildingId)).toBe(
      'Bâtiment inconnu',
    );
    expect(constructionStatus(state, 'guild')).toMatch(/Requis/);
    state.gold = 0;
    state.crystals = 0;
    expect(constructionStatus(state, 'sol')).toBe('Ressources insuffisantes');
    state.gold = 10000;
    state.crystals = 100;
    const built = reduce(state, { type: 'build', building: 'sol' });
    expect(constructionStatus(built, 'sol')).toBe('Déjà construit');
    expect(constructionStatus(built, 'guild')).toBe(
      'Un bâtiment a déjà été construit aujourd’hui',
    );
  });
  it(
    'préserve les bâtiments des sauvegardes et rejette les champs invalides',
    () => {
    const old = newGame();
    delete old.built;
    delete old.buildDay;
    expect(builtBuildings(loadGame(JSON.stringify(old))!)).toHaveLength(7);
    expect(
      loadGame(JSON.stringify({ ...newGame(), built: ['keep', 'pirate'] })),
    ).toBeNull();
    expect(loadGame(JSON.stringify({ ...newGame(), buildDay: 99 }))).toBeNull();
  });
});
