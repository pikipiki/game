import { describe, expect, it } from 'vitest';
import { getCreature, key } from '@/game/data';
import {
  activeUnit,
  newGame,
  reachable,
  reduce,
  type GameState,
} from '@/game/engine';
import {
  battleControls,
  turnOrder,
  type BattleSelection,
} from '@/game/battle/controls';
import { animationPlan, animationProgress } from '@/game/battle/animation';
import {
  buildCombatChromeModel,
  buildCombatToolbarModel,
  buildFighterPanelModel,
  buildTacticalGridModel,
} from '@/game/battle/presentation';
import { battleTitle } from '@/game/opponent';
import { createTranslator } from '@/i18n/translate';
const empty: BattleSelection = { unit: null, hex: null, spell: null };
const tFr = createTranslator('fr');
const tEn = createTranslator('en');
function battle(): GameState {
  const state = newGame();
  state.hero = { q: -1, r: -2 };
  return reduce(state, { type: 'fight', site: 'camp1' });
}

function nearEnemy(): GameState {
  const state = battle(),
    actor = activeUnit(state)!;
  actor.q = 5;
  actor.r = 0;
  return state;
}
describe('Commandes de combat', () => {
  it(
    'ne propose pas d’attaque sans cible ou hors de portée',
    () => {
    const state = battle();
    expect(battleControls(state, empty).attack).toBe(false);
    activeUnit(state)!.shots = 0;
    expect(battleControls(state, { ...empty, unit: 'enemy-0' }).attack).toBe(
      false,
    );
  });
  it(
    'prévoit les dégâts et pertes réellement appliqués par le moteur',
    () => {
    const state = nearEnemy(),
      selection = { ...empty, unit: 'enemy-0' },
      controls = battleControls(state, selection);
    expect(controls.attack).toBe(true);
    const target = controls.target!,
      after = reduce(state, { type: 'attack', target: target.id }),
      changed = after.battle!.units.find((unit) => unit.id === target.id)!;
    expect(target.hp - changed.hp).toBe(Math.min(target.hp, controls.hits));
    const creature = getCreature(target.creature);
    expect(controls.loss).toBe(
      Math.ceil(target.hp / creature.hp) -
        Math.ceil(changed.hp / creature.hp),
    );
  });
  it(
    'active Déplacer uniquement pour une case accessible',
    () => {
    const state = battle(),
      to = reachable(state)[0]!;
    expect(battleControls(state, { ...empty, hex: to }).move).toBe(true);
    expect(battleControls(state, { ...empty, hex: { q: 7, r: 4 } }).move).toBe(
      false,
    );
  });
  it(
    'valide le camp de la cible des sorts et les réserves de mana',
    () => {
    const state = battle();
    expect(
      battleControls(state, { ...empty, unit: 'enemy-0', spell: 'bolt' }).cast,
    ).toBe(true);
    expect(
      battleControls(state, { ...empty, unit: 'enemy-0', spell: 'heal' }).cast,
    ).toBe(false);
    state.mana = 0;
    expect(
      battleControls(state, { ...empty, unit: 'enemy-0', spell: 'bolt' }).cast,
    ).toBe(false);
  });
  it(
    'bloque les commandes au tour ennemi et après le résultat',
    () => {
    const state = battle();
    state.battle!.active = 'enemy-0';
    expect(battleControls(state, { ...empty, unit: 'army-sol' }).canPlay).toBe(
      false,
    );
    state.battle!.result = 'victory';
    expect(turnOrder(state)).toEqual([]);
  });
  it(
    'affiche l’ordre actuel sans les troupes éliminées',
    () => {
    const state = battle();
    state.battle!.units.find((unit) => unit.id === 'enemy-0')!.hp = 0;
    const order = turnOrder(state);
    expect(order[0]!.id).toBe(state.battle!.active);
    expect(order.some((unit) => unit.id === 'enemy-0')).toBe(false);
  });
  it(
    'affiche les commandes, les points de vie et la grille alternative',
    () => {
    const state = battle();
    const toolbar = buildCombatToolbarModel(state, empty, false, tFr)!;
    expect(toolbar.commands!.some((cmd) => cmd.label === 'Attaquer')).toBe(
      true,
    );
    expect(toolbar.commands!.some((cmd) => cmd.label === 'Déplacer')).toBe(
      true,
    );
    const panel = buildFighterPanelModel(state, { ...empty, unit: 'enemy-0' });
    expect(panel.eyebrow).toContain('TROUPE ADVERSE');
    expect(buildTacticalGridModel(state).length).toBeGreaterThan(0);
  });
  it(
    'couvre les variantes d’interface de bataille et les messages contextuels',
    () => {
    const state = battle();
    expect(buildCombatChromeModel(state, empty, true).eyebrow).toContain(
      'COMBAT D’ENTRAÎNEMENT',
    );
    state.battle!.opponent = { hero: 'enemy-dusk', town: 'home' };
    expect(buildCombatChromeModel(state, empty, false).eyebrow).toContain(
      'DÉFENSE DU CHÂTEAU',
    );
    expect(battleTitle(state)).toMatch(/Citadelle|biscuits/i);
    state.battle!.opponent = { hero: 'enemy-dusk' };
    expect(battleTitle(state)).toContain('Noisette');
    delete state.battle!.opponent;
    state.battle!.siege = { wallHp: 50, maxWallHp: 180 };
    expect(buildCombatChromeModel(state, empty, false).eyebrow).toContain(
      'SIÈGE',
    );
    const to = reachable(state)[0]!;
    expect(
      buildCombatToolbarModel(state, { ...empty, hex: to }, false, tFr)!.hint,
    ).toContain('confirmez le déplacement');
    expect(
      buildCombatToolbarModel(state, { ...empty, unit: 'enemy-0' }, false, tFr)!
        .hint,
    ).toContain('dégâts prévus');
    expect(buildCombatToolbarModel(battle(), empty, false, tFr)!.hint).toContain(
      'case bleue',
    );
    const far = battle();
    far.battle!.active = 'army-sylve';
    const ally = activeUnit(far)!;
    ally.q = 0;
    ally.r = 0;
    const enemy = far.battle!.units.find((unit) => unit.id === 'enemy-1')!;
    enemy.q = 14;
    enemy.r = 6;
    expect(
      buildCombatToolbarModel(far, { ...empty, unit: 'enemy-1' }, false, tFr)!
        .hint,
    ).toContain('hors de portée');
    expect(
      buildCombatToolbarModel(battle(), { ...empty, spell: 'heal' }, false, tFr)!
        .hint,
    ).toContain('un allié');
    expect(
      buildCombatToolbarModel(state, { ...empty, spell: 'bolt' }, false, tFr)!
        .hint,
    ).toContain('confirmez le sort');
    state.battle!.result = 'victory';
    expect(
      buildCombatToolbarModel(state, empty, false, tFr)!.summaryHeading,
    ).toContain('VICTOIRE');
    state.battle!.result = 'defeat';
    expect(
      buildCombatToolbarModel(state, empty, true, tFr)!.continueLabel,
    ).toContain('Retour à la campagne');
    const enToolbar = buildCombatToolbarModel(battle(), empty, false, tEn)!;
    expect(enToolbar.commands!.some((cmd) => cmd.label === 'Attack')).toBe(
      true,
    );
    expect(enToolbar.commands!.some((cmd) => cmd.label === 'Move')).toBe(true);
    expect(enToolbar.castSpellLabel).toBe('Cast spell');
  });
  it(
    'inclut les unités en attente dans l’ordre d’initiative',
    () => {
    const state = battle();
    delete state.battle!.waiting;
    expect(turnOrder(state).length).toBeGreaterThan(1);
    state.battle!.waiting = ['army-sol'];
    expect(turnOrder(state).some((unit) => unit.id === 'army-sol')).toBe(true);
    state.battle!.opponent = {
      hero: 'enemy-dusk',
      armyBackup: structuredClone(state.army),
    };
    expect(
      battleControls(state, { ...empty, unit: 'enemy-0', spell: 'bolt' }).cast,
    ).toBe(false);
  });
});
describe('Animations pilotées par les résultats du combat', () => {
  it(
    'accepte un timestamp antérieur au début sans index négatif',
    () => {
    expect(animationProgress(100, 200, 0)).toBe(1);
    expect(animationProgress(100, 99, 650)).toBe(0);
    expect(animationProgress(100, 425, 650)).toBe(0.5);
    expect(animationProgress(100, 900, 650)).toBe(1);
  });
  it(
    'anime un déplacement suivant les cases du chemin légal',
    () => {
    const state = battle(),
      moves = reachable(state),
      to =
        moves.find((hex) => hex.q === 2 && hex.r === 2) ?? moves[0]!,
      after = reduce(state, { type: 'battle-move', to }),
      plan = animationPlan(state, after, { type: 'battle-move', to })!;
    expect(plan.kind).toBe('move');
    expect(plan.path.length).toBeGreaterThan(1);
    expect(key(plan.path.at(-1)!)).toBe(key(to));
    expect(plan.changes).toEqual([]);
  });
  it(
    'anime les tirs et les dégâts réellement subis',
    () => {
    const state = nearEnemy(),
      after = reduce(state, { type: 'attack', target: 'enemy-0' }),
      plan = animationPlan(state, after, {
        type: 'attack',
        target: 'enemy-0',
      })!;
    expect(plan.kind).toBe('attack');
    expect(plan.ranged).toBe(true);
    expect(plan.target).toBe('enemy-0');
    expect(plan.changes[0]!.amount).toBeLessThan(0);
  });
  it('détecte une troupe vaincue par un éclair', () => {
    const state = battle(),
      after = reduce(state, {
        type: 'spell',
        spell: 'bolt',
        target: 'enemy-1',
      }),
      plan = animationPlan(state, after, {
        type: 'spell',
        spell: 'bolt',
        target: 'enemy-1',
      })!;
    expect(plan.kind).toBe('bolt');
    expect(
      plan.changes.find((change) => change.id === 'enemy-1')?.defeated,
    ).toBe(true);
  });
  it('différencie les soins et la défense', () => {
    const state = battle(),
      actor = activeUnit(state)!;
    actor.hp -= 30;
    const healed = reduce(state, {
      type: 'spell',
      spell: 'heal',
      target: actor.id,
    });
    expect(
      animationPlan(state, healed, {
        type: 'spell',
        spell: 'heal',
        target: actor.id,
      })!.changes[0]!.amount,
    ).toBe(30);
    const defended = reduce(state, { type: 'defend' });
    expect(animationPlan(state, defended, { type: 'defend' })!.kind).toBe(
      'defend',
    );
  });
  it('anime aussi les déplacements de l’IA', () => {
    const state = battle();
    state.battle!.active = 'enemy-0';
    const after = reduce(state, { type: 'enemy' });
    expect(animationPlan(state, after, { type: 'enemy' })!.kind).toBe('move');
  });
  it(
    'n’anime ni les actions refusées ni les opérations de campagne',
    () => {
    const state = battle();
    expect(
      animationPlan(state, state, { type: 'attack', target: 'enemy-0' }),
    ).toBeNull();
    expect(animationPlan(newGame(), newGame(), { type: 'end-day' })).toBeNull();
  });
});

// Siege shots have their own visual event, even though no creature loses HP.
it(
  'anime la catapulte avec un événement distinct',
  () => {
  let state = newGame();
  state.hero = { q: -2, r: -1 };
  state = reduce(state, { type: 'fight', site: 'shade-castle' });
  state.battle!.active = 'army-sol';
  const next = reduce(state, { type: 'catapult' });
  const plan = animationPlan(state, next, { type: 'catapult' });
  expect(plan?.kind).toBe('catapult');
  expect(plan?.duration).toBeGreaterThan(500);
  expect(plan?.changes).toEqual([]);
});
