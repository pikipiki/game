import { describe, expect, it } from 'vitest';
import { CREATURES, key } from './data';
import { activeUnit, newGame, reachable, reduce, type GameState } from './engine';
import { battleControls, turnOrder, type BattleSelection } from './battle-controls';
import { animationPlan, animationProgress } from './battle-animation';
import { battleToolbar, movePicker, fighterPanel } from '../battle-ui';
const empty: BattleSelection = { unit: null, hex: null, spell: null };
function battle(): GameState {
  const s = newGame();
  s.hero = { q: -1, r: -2 };
  return reduce(s, { type: 'fight', site: 'camp1' });
}
function nearEnemy(): GameState {
  const s = battle(),
    a = activeUnit(s)!;
  a.q = 5;
  a.r = 0;
  return s;
}
describe('Commandes de combat', () => {
  it('ne propose pas d’attaque sans cible ou hors de portée', () => {
    const s = battle();
    expect(battleControls(s, empty).attack).toBe(false);
    activeUnit(s)!.shots = 0;
    expect(battleControls(s, { ...empty, unit: 'enemy-0' }).attack).toBe(false);
  });
  it('prévoit les dégâts et pertes réellement appliqués par le moteur', () => {
    const s = nearEnemy(),
      selection = { ...empty, unit: 'enemy-0' },
      c = battleControls(s, selection);
    expect(c.attack).toBe(true);
    const target = c.target!,
      after = reduce(s, { type: 'attack', target: target.id }),
      changed = after.battle!.units.find((u) => u.id === target.id)!;
    expect(target.hp - changed.hp).toBe(Math.min(target.hp, c.hits));
    expect(c.loss).toBe(
      Math.ceil(target.hp / CREATURES[target.creature].hp) -
        Math.ceil(changed.hp / CREATURES[target.creature].hp),
    );
  });
  it('active Déplacer uniquement pour une case accessible', () => {
    const s = battle(),
      to = reachable(s)[0];
    expect(battleControls(s, { ...empty, hex: to }).move).toBe(true);
    expect(battleControls(s, { ...empty, hex: { q: 7, r: 4 } }).move).toBe(false);
  });
  it('valide le camp de la cible des sorts et les réserves de mana', () => {
    const s = battle();
    expect(battleControls(s, { ...empty, unit: 'enemy-0', spell: 'bolt' }).cast).toBe(true);
    expect(battleControls(s, { ...empty, unit: 'enemy-0', spell: 'heal' }).cast).toBe(false);
    s.mana = 0;
    expect(battleControls(s, { ...empty, unit: 'enemy-0', spell: 'bolt' }).cast).toBe(false);
  });
  it('bloque les commandes au tour ennemi et après le résultat', () => {
    const s = battle();
    s.battle!.active = 'enemy-0';
    expect(battleControls(s, { ...empty, unit: 'army-sol' }).canPlay).toBe(false);
    s.battle!.result = 'victory';
    expect(turnOrder(s)).toEqual([]);
  });
  it('affiche l’ordre actuel sans les troupes éliminées', () => {
    const s = battle();
    s.battle!.units.find((u) => u.id === 'enemy-0')!.hp = 0;
    const order = turnOrder(s);
    expect(order[0].id).toBe(s.battle!.active);
    expect(order.some((u) => u.id === 'enemy-0')).toBe(false);
  });
  it('affiche les commandes, les points de vie et la grille alternative', () => {
    const s = battle();
    expect(battleToolbar(s, empty, false)).toContain('Attaquer');
    expect(battleToolbar(s, empty, false)).toContain('Déplacer');
    expect(fighterPanel(s, { ...empty, unit: 'enemy-0' })).toContain('TROUPE ADVERSE');
    expect(movePicker(s)).toContain('Cases accessibles');
  });
});
describe('Animations pilotées par les résultats du combat', () => {
  it('accepte un premier timestamp antérieur au début de l’action sans index négatif', () => {
    expect(animationProgress(100, 99, 650)).toBe(0);
    expect(animationProgress(100, 425, 650)).toBe(0.5);
    expect(animationProgress(100, 900, 650)).toBe(1);
  });
  it('anime un déplacement suivant les cases du chemin légal', () => {
    const s = battle(),
      to = reachable(s).find((h) => h.q === 2 && h.r === 2) ?? reachable(s)[0],
      after = reduce(s, { type: 'battle-move', to }),
      plan = animationPlan(s, after, { type: 'battle-move', to })!;
    expect(plan.kind).toBe('move');
    expect(plan.path.length).toBeGreaterThan(1);
    expect(key(plan.path.at(-1)!)).toBe(key(to));
    expect(plan.changes).toEqual([]);
  });
  it('anime les tirs et les dégâts réellement subis', () => {
    const s = nearEnemy(),
      after = reduce(s, { type: 'attack', target: 'enemy-0' }),
      plan = animationPlan(s, after, { type: 'attack', target: 'enemy-0' })!;
    expect(plan.kind).toBe('attack');
    expect(plan.ranged).toBe(true);
    expect(plan.target).toBe('enemy-0');
    expect(plan.changes[0].amount).toBeLessThan(0);
  });
  it('détecte une troupe vaincue par un éclair', () => {
    const s = battle(),
      after = reduce(s, { type: 'spell', spell: 'bolt', target: 'enemy-1' }),
      plan = animationPlan(s, after, { type: 'spell', spell: 'bolt', target: 'enemy-1' })!;
    expect(plan.kind).toBe('bolt');
    expect(plan.changes.find((c) => c.id === 'enemy-1')?.defeated).toBe(true);
  });
  it('différencie les soins et la défense', () => {
    const s = battle(),
      a = activeUnit(s)!;
    a.hp -= 30;
    const healed = reduce(s, { type: 'spell', spell: 'heal', target: a.id });
    expect(
      animationPlan(s, healed, { type: 'spell', spell: 'heal', target: a.id })!.changes[0].amount,
    ).toBe(30);
    const defended = reduce(s, { type: 'defend' });
    expect(animationPlan(s, defended, { type: 'defend' })!.kind).toBe('defend');
  });
  it('anime aussi les déplacements de l’IA', () => {
    const s = battle();
    s.battle!.active = 'enemy-0';
    const after = reduce(s, { type: 'enemy' });
    expect(animationPlan(s, after, { type: 'enemy' })!.kind).toBe('move');
  });
  it('n’anime ni les actions refusées ni les opérations de campagne', () => {
    const s = battle();
    expect(animationPlan(s, s, { type: 'attack', target: 'enemy-0' })).toBeNull();
    expect(animationPlan(newGame(), newGame(), { type: 'end-day' })).toBeNull();
  });
});

// Siege shots have their own visual event, even though no creature loses HP.
it('anime la catapulte avec un événement distinct', () => {
  let s = newGame();
  s.hero = { q: -2, r: -1 };
  s = reduce(s, { type: 'fight', site: 'shade-castle' });
  s.battle!.active = 'army-sol';
  const next = reduce(s, { type: 'catapult' });
  const plan = animationPlan(s, next, { type: 'catapult' });
  expect(plan?.kind).toBe('catapult');
  expect(plan?.duration).toBeGreaterThan(500);
  expect(plan?.changes).toEqual([]);
});
