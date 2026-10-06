import { describe, it, expect } from 'vitest';
import {
  battleDistance,
  battlePathTo,
  BATTLE_TILES,
  key,
  getCreature,
} from '@/game/data';
import {
  activeUnit,
  attackPosition,
  damage,
  newGame,
  reachable,
  reduce,
  type GameState,
} from '@/game/engine';
import { battlePoint, battleHexAt } from '@/render/battle-space';
function battle(): GameState {
  const state = newGame();
  state.hero = { q: -1, r: -2 };
  return reduce(state, { type: 'fight', site: 'camp1' });
}

function enemyTurnOrDefend(state: GameState): GameState {
  const actor = activeUnit(state)!;
  if (actor.side === 'enemy') {
    return reduce(state, { type: 'enemy' });
  }
  return reduce(state, { type: 'defend' });
}

describe('Arène et clics sur les cases', () => {
  it(
    'retrouve chacune des 187 cases avec un léger décalage de pointage',
    () => {
    for (const hex of BATTLE_TILES) {
      const point = battlePoint(hex);
      for (const offsets of [
        [0, 0],
        [0.2, 0.1],
        [-0.2, -0.1],
      ] as const)
        {expect(
          battleHexAt(point.x + offsets[0], point.z + offsets[1]),
        ).toEqual(hex);}
    }
    expect(battleHexAt(1000, 1000)).toBeNull();
  });
  it(
    'suit des voisins réels sur les rangées décalées et évite les obstacles',
    () => {
    const path = battlePathTo(
      { q: 0, r: 0 },
      { q: 16, r: 10 },
      BATTLE_TILES,
      new Set(['8,5']),
    );
    let previous = { q: 0, r: 0 };
    for (const tile of path) {
      expect(battleDistance(previous, tile)).toBe(1);
      expect(key(tile)).not.toBe('8,5');
      previous = tile;
    }
    expect(previous).toEqual({ q: 16, r: 10 });
  });
});
describe('Tactiques proches de Heroes III', () => {
  it(
    'la vitesse donne la portée de déplacement au lieu de deux cases fixes',
    () => {
    const state = battle(),
      actor = activeUnit(state)!;
    expect(getCreature(actor.creature).speed).toBe(4);
    expect(
      reachable(state).some((hex) => battleDistance(actor, hex) === 4),
    ).toBe(true);
    actor.slowed = true;
    expect(
      reachable(state).every((hex) => battleDistance(actor, hex) <= 1),
    ).toBe(true);
  });
  it(
    'attend une seule fois et rejoue à la fin du round',
    () => {
    let state = battle();
    const id = activeUnit(state)!.id;
    state = reduce(state, { type: 'wait' });
    expect(state.battle!.waiting).toContain(id);
    for (let turn = 0; turn < 8 && state.battle!.active !== id; turn++)
      {state = enemyTurnOrDefend(state);}
    expect(state.battle!.active).toBe(id);
    expect(state.battle!.round).toBe(1);
    expect(reduce(state, { type: 'wait' })).toBe(state);
  });
  it(
    'les tirs lointains sont réduits et dépensent des munitions',
    () => {
    const state = battle(),
      actor = activeUnit(state)!,
      target = state.battle!.units.find((unit) => unit.side === 'enemy')!;
    const close = { ...target, q: actor.q + 3, r: actor.r };
    expect(damage(actor, target)).toBeLessThan(damage(actor, close));
    const next = reduce(state, { type: 'attack', target: target.id });
    expect(next.battle!.units.find((unit) => unit.id === actor.id)!.shots).toBe(
      11,
    );
  });
  it(
    'un archer engagé ne tire pas sur une autre troupe à distance',
    () => {
    const state = battle(),
      actor = activeUnit(state)!;
    state.battle!.units.find((unit) => unit.id === 'enemy-0')!.q = actor.q + 1;
    state.battle!.units.find((unit) => unit.id === 'enemy-0')!.r = actor.r;
    expect(
      attackPosition(
        state,
        state.battle!.units.find((unit) => unit.id === 'enemy-1')!,
      ),
    ).toBeNull();
  });
  it(
    'une attaque de mêlée déclenche une riposte limitée à une par round',
    () => {
    const state = battle();
    state.battle!.active = 'army-sylve';
    const actor = activeUnit(state)!,
      target = state.battle!.units.find((unit) => unit.id === 'enemy-0')!;
    Object.assign(actor, { q: 4, r: 4 });
    Object.assign(target, { q: 5, r: 4, hp: 240, maxHp: 240 });
    const next = reduce(state, { type: 'attack', target: target.id });
    const actorAfter = next.battle!.units.find((unit) => unit.id === actor.id)!;
    expect(actorAfter.hp).toBeLessThan(actor.hp);
    expect(
      next.battle!.units.find((unit) => unit.id === target.id)!.retaliated,
    ).toBe(true);
    next.battle!.active = actor.id;
    const hp = next.battle!.units.find((unit) => unit.id === actor.id)!.hp;
    const again = reduce(next, { type: 'attack', target: target.id });
    expect(again.battle!.units.find((unit) => unit.id === actor.id)!.hp).toBe(
      hp,
    );
  });
  it(
    'avance et frappe en une action lorsque la cible est à portée de marche',
    () => {
    const state = battle();
    state.battle!.active = 'army-sylve';
    const actor = activeUnit(state)!,
      target = state.battle!.units.find((unit) => unit.id === 'enemy-0')!;
    Object.assign(actor, { q: 3, r: 3 });
    Object.assign(target, { q: 6, r: 3 });
    const position = attackPosition(state, target)!;
    expect(position).not.toBeNull();
    const next = reduce(state, { type: 'attack', target: target.id });
    const moved = next.battle!.units.find((unit) => unit.id === actor.id)!;
    expect(battleDistance(moved, target)).toBe(1);
    expect(
      next.battle!.units.find((unit) => unit.id === target.id)!.hp,
    ).toBeLessThan(target.hp);
  });
  it(
    'le héros ne lance qu’un sort par round tout en laissant jouer sa troupe',
    () => {
    const state = battle(),
      id = activeUnit(state)!.id,
      next = reduce(state, { type: 'spell', spell: 'bolt', target: 'enemy-0' });
    expect(next.battle!.active).toBe(id);
    expect(
      reduce(next, { type: 'spell', spell: 'bolt', target: 'enemy-1' }),
    ).toBe(next);
  });
});
