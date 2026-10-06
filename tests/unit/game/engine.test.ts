import { describe, expect, it } from 'vitest';
import {
  BATTLE_TILES,
  battleDistance,
  CREATURES,
  getCreature,
  SITES,
  WALKABLE,
  WORLD,
  distance,
  key,
  pathTo,
} from '@/game/data';
import {
  activeUnit,
  canAttack,
  damage,
  income,
  loadGame,
  maxMana,
  newGame,
  reachable,
  reduce,
  type GameState,
} from '@/game/engine';

const ACTION_FINISH_BATTLE = 'finish-battle' as const;
const ARMY_SYLVE_ID = 'army-sylve';
const SITE_SHADE_CASTLE = 'shade-castle';

function atCamp(): GameState {
  const state = newGame();
  state.hero = { q: -1, r: -2 };
  return reduce(state, { type: 'fight', site: 'camp1' });
}

function allyTurn(): GameState {
  let state = atCamp();
  while (activeUnit(state)?.side === 'enemy') {
    state = reduce(state, { type: 'enemy' });
  }
  return state;
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

function autoBattle(start: GameState): GameState {
  let state = start;
  for (let turn = 0; turn < 600 && !state.battle?.result; turn++) {
    const actor = activeUnit(state)!;
    if (actor.side === 'enemy') {
      state = reduce(state, { type: 'enemy' });
      continue;
    }
    if (state.battle?.siege?.wallHp && !state.battle.opponent?.town) {
      state = reduce(state, { type: 'catapult' });
      continue;
    }
    const enemies = state.battle!.units.filter(
      (unit) => unit.side === 'enemy' && unit.hp > 0,
    );
    const target = enemies
      .filter((enemy) => canAttack(actor, enemy, state.battle!.units))
      .sort((left, right) => left.hp - right.hp)[0];
    if (target) {
      state = reduce(state, { type: 'attack', target: target.id });
      continue;
    }
    state = battleMoveOrDefend(state);
  }
  expect(state.battle?.result).not.toBeNull();
  return state;
}

function travel(start: GameState, siteId: string): GameState {
  let state = start;
  const target = SITES.find((worldSite) => worldSite.id === siteId)!;
  for (let step = 0; step < 30 && key(state.hero) !== key(target); step++) {
    if (state.battle) {
      state = reduce(autoBattle(state), { type: ACTION_FINISH_BATTLE });
      continue;
    }
    const path = pathTo(state.hero, target, WALKABLE);
    if (state.movement === 0) {
      state = reduce(state, { type: 'end-day' });
      continue;
    }
    state = reduce(state, { type: 'move', to: path[0]! });
  }
  expect(key(state.hero)).toBe(key(target));
  return state;
}

describe('Hexagones et carte', () => {
  it(
    'calcule la distance hexagonale et les voisins',
    () => {
    expect(distance({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1);
    expect(distance({ q: -3, r: 2 }, { q: 3, r: -2 })).toBe(6);
  });
  it(
    'relie chaque lieu sans traverser les obstacles',
    () => {
    for (const site of SITES.slice(1)) {
      const path = pathTo(SITES[0]!, site, WALKABLE);
      expect(path.length).toBeGreaterThan(0);
      expect(
        path.every((tile) =>
          WALKABLE.some((walk) => key(walk) === key(tile)),
        ),
      ).toBe(true);
    }
  });
  it(
    'respecte les cases bloquées et les destinations hors carte',
    () => {
    expect(
      pathTo(
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        [
          { q: 0, r: 0 },
          { q: 1, r: 0 },
        ],
        new Set(['1,0']),
      ),
    ).toEqual([]);
    expect(pathTo({ q: 0, r: 0 }, { q: 100, r: 0 }, WORLD)).toEqual([]);
  });
});
describe('Exploration et économie', () => {
  it(
    'commence avec les deux familles des photos',
    () => {
    const state = newGame();
    expect(state.army.map((unit) => unit.creature)).toEqual(['sylve', 'sol']);
    expect(state.explored).toContain(key(state.hero));
  });
  it('ne modifie jamais l’état précédent', () => {
    const state = newGame(),
      snapshot = JSON.stringify(state);
    reduce(state, { type: 'end-day' });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
  it('dépense les pas et révèle la brume', () => {
    const state = newGame(),
      next = reduce(state, { type: 'move', to: { q: -2, r: 2 } });
    expect(next.movement).toBe(state.movement - 1);
    expect(next.explored.length).toBeGreaterThan(state.explored.length);
  });
  it(
    'interdit la téléportation, l’eau et les terres non révélées',
    () => {
    const state = newGame();
    expect(reduce(state, { type: 'move', to: { q: 3, r: -2 } })).toBe(state);
    expect(reduce(state, { type: 'move', to: { q: -4, r: 1 } })).toBe(state);
    state.movement = 0;
    expect(reduce(state, { type: 'move', to: { q: -2, r: 2 } })).toBe(state);
  });
  it(
    'capture une mine et cumule les revenus au prochain jour',
    () => {
    let state = travel(newGame(), 'gold');
    expect(state.owned).toContain('gold');
    const before = state.gold;
    state = reduce(state, { type: 'end-day' });
    expect(state.gold - before).toBe(400);
    expect(income(state)).toBe(400);
  });
  it(
    'les cristaux capturés produisent 3 unités par jour',
    () => {
    let state = travel(newGame(), 'crystal');
    const before = state.crystals;
    state = reduce(state, { type: 'end-day' });
    expect(state.crystals - before).toBe(3);
  });
  it(
    'la source restaure le mana sans dépasser le maximum',
    () => {
    let state = newGame();
    state.mana = 0;
    state = travel(state, 'spring');
    expect(state.mana).toBe(maxMana(state));
  });
  it(
    'recrute par lots de trois jusqu’à épuisement du stock hebdomadaire',
    () => {
    let state = newGame();
    state.gold = 10000;
    for (let round = 0; round < 4; round++)
      {state = reduce(state, { type: 'recruit', family: 'sylve' });}
    expect(state.army[0]!.count).toBe(20);
    expect(reduce(state, { type: 'recruit', family: 'sylve' })).toBe(state);
    state = reduce(state, { type: 'end-day' });
    expect(state.recruited).toBe(0);
  });
  it(
    'interdit le recrutement à distance ou sans or',
    () => {
    const state = newGame();
    state.gold = 0;
    expect(reduce(state, { type: 'recruit', family: 'sol' })).toBe(state);
    state.gold = 1000;
    state.hero = { q: 0, r: 0 };
    expect(reduce(state, { type: 'recruit', family: 'sol' })).toBe(state);
  });
  it(
    'améliore le château, ses revenus et ses capacités',
    () => {
    let state = newGame();
    state = reduce(state, { type: 'upgrade' });
    expect(state.castle).toBe(2);
    expect(state.gold).toBe(500);
    expect(state.crystals).toBe(7);
    expect(state.movement).toBe(8);
    expect(income(state)).toBe(300);
  });
});
describe('Évolutions', () => {
  it(
    'chaque variante appartient à une branche de sa famille',
    () => {
    for (const creature of Object.values(CREATURES)) {
      for (const evolveId of creature.evolves) {
        const evolved = getCreature(evolveId);
        expect(evolved.family).toBe(creature.family);
        expect(evolved.tier).toBe(creature.tier + 1);
      }
    }
  });
  it('refuse une évolution sans expérience', () => {
    const state = newGame();
    expect(
      reduce(state, {
        type: 'evolve',
        id: ARMY_SYLVE_ID,
        creature: 'sylve-guard',
      }),
    ).toBe(state);
  });
  it(
    'évolue toute la troupe et déduit les ressources',
    () => {
    const state = newGame();
    state.army[0]!.xp = 55;
    const next = reduce(state, {
      type: 'evolve',
      id: ARMY_SYLVE_ID,
      creature: 'sylve-druid',
    });
    expect(next.army[0]!.creature).toBe('sylve-druid');
    expect(next.army[0]!.count).toBe(8);
    expect(next.gold).toBe(state.gold - 240);
    expect(next.crystals).toBe(state.crystals - 4);
  });
  it(
    'refuse les branches étrangères et les sauts de niveau',
    () => {
    const state = newGame();
    state.army[0]!.xp = 500;
    expect(
      reduce(state, {
        type: 'evolve',
        id: ARMY_SYLVE_ID,
        creature: 'sol-star',
      }),
    ).toBe(state);
    expect(
      reduce(state, {
        type: 'evolve',
        id: ARMY_SYLVE_ID,
        creature: 'sylve-ancient',
      }),
    ).toBe(state);
  });
  it(
    'les nouvelles recrues héritent de la variante choisie',
    () => {
    let state = newGame();
    state.army[0]!.xp = 60;
    state = reduce(state, {
      type: 'evolve',
      id: ARMY_SYLVE_ID,
      creature: 'sylve-guard',
    });
    state = reduce(state, { type: 'recruit', family: 'sylve' });
    expect(state.army[0]!.creature).toBe('sylve-guard');
    expect(state.army[0]!.count).toBe(11);
  });
});
describe('Combats tactiques', () => {
  it(
    'empêche le combat à distance et ferme la forteresse avant les camps',
    () => {
    const state = newGame();
    expect(reduce(state, { type: 'fight', site: 'camp1' })).toBe(state);
    state.hero = { q: 3, r: -2 };
    expect(reduce(state, { type: 'fight', site: 'boss' })).toBe(state);
  });
  it(
    'initialise une file de tours ordonnée par la vitesse',
    () => {
    const state = atCamp(),
      actor = activeUnit(state)!;
    expect(getCreature(actor.creature).speed).toBe(4);
    expect(state.battle!.units).toHaveLength(4);
    expect(state.battle!.round).toBe(1);
  });
  it(
    'bloque les actions alliées pendant un tour ennemi',
    () => {
    const state = atCamp();
    state.battle!.active = 'enemy-0';
    expect(reduce(state, { type: 'defend' })).toBe(state);
  });
  it(
    'avance uniquement vers une case accessible et termine le tour',
    () => {
    const state = allyTurn(),
      actor = activeUnit(state)!,
      moves = reachable(state);
    expect(moves.length).toBeGreaterThan(0);
    const next = reduce(state, { type: 'battle-move', to: moves[0]! });
    expect(key(next.battle!.units.find((unit) => unit.id === actor.id)!)).toBe(
      key(moves[0]!),
    );
    expect(next.battle!.active).not.toBe(actor.id);
  });
  it(
    'ne traverse pas une troupe et refuse une case lointaine',
    () => {
    const state = allyTurn();
    expect(
      reachable(state).some((tile) =>
        state.battle!.units.some(
          (unit) => unit.hp > 0 && key(unit) === key(tile),
        ),
      ),
    ).toBe(false);
    expect(
      reduce(state, { type: 'battle-move', to: { q: 7, r: 4 } }),
    ).toBe(state);
  });
  it(
    'calcule les dégâts selon la troupe, la défense et la protection',
    () => {
    const state = allyTurn(),
      actor = activeUnit(state)!,
      target = state.battle!.units.find((unit) => unit.side === 'enemy')!;
    const base = damage(actor, target);
    target.defending = true;
    expect(damage(actor, target)).toBeLessThan(base);
    expect(damage(actor, target)).toBeGreaterThan(0);
  });
  it(
    'refuse une attaque sur un allié ou un tireur sans munitions',
    () => {
    const state = allyTurn(),
      actor = activeUnit(state)!;
    expect(reduce(state, { type: 'attack', target: actor.id })).toBe(state);
    actor.shots = 0;
    expect(reduce(state, { type: 'attack', target: 'enemy-0' })).toBe(state);
  });
  it(
    'un sort consomme du mana et conserve le tour de la troupe',
    () => {
    const state = allyTurn(),
      actor = activeUnit(state)!,
      next = reduce(state, { type: 'spell', spell: 'bolt', target: 'enemy-0' });
    expect(next.mana).toBe(state.mana - 4);
    const boltTarget = next.battle!.units.find(
      (unit) => unit.id === 'enemy-0',
    )!;
    expect(boltTarget.hp).toBe(35);
    expect(next.battle!.active).toBe(actor.id);
    expect(
      reduce(next, { type: 'spell', spell: 'bolt', target: 'enemy-1' }),
    ).toBe(next);
  });
  it(
    'refuse un sort sans mana ou sur le mauvais camp',
    () => {
    const state = allyTurn();
    state.mana = 3;
    expect(
      reduce(state, { type: 'spell', spell: 'bolt', target: 'enemy-0' }),
    ).toBe(state);
    state.mana = 10;
    expect(
      reduce(state, { type: 'spell', spell: 'heal', target: 'enemy-0' }),
    ).toBe(state);
  });
  it(
    'l’IA agit et l’exploration reste bloquée pendant le combat',
    () => {
    const state = atCamp();
    state.battle!.active = 'enemy-0';
    const next = reduce(state, { type: 'enemy' });
    expect(next).not.toBe(state);
    expect(next.battle!.active).not.toBe('enemy-0');
    expect(reduce(next, { type: 'end-day' })).toBe(next);
  });
  it(
    'une victoire accorde ressources et expérience une seule fois',
    () => {
    let state = atCamp();
    state.army.forEach((unit) => (unit.count = 35));
    const allies = state.battle!.units.filter((unit) => unit.side === 'ally');
    allies.forEach((unit) => {
      unit.count = 35;
      unit.hp = unit.maxHp = 35 * getCreature(unit.creature).hp;
    });
    state = autoBattle(state);
    expect(state.battle!.result).toBe('victory');
    const gold = state.gold;
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(state.gold).toBe(gold + 450);
    expect(state.army.every((unit) => unit.xp === 55)).toBe(true);
    expect(state.cleared).toContain('camp1');
    expect(reduce(state, { type: 'fight', site: 'camp1' })).toBe(state);
  });
  it(
    'la retraite revient au château avec des pertes',
    () => {
    const state = atCamp(),
      next = reduce(state, { type: 'retreat' });
    expect(next.battle).toBeNull();
    expect(key(next.hero)).toBe(key(SITES[0]!));
    expect(next.movement).toBe(0);
    expect(next.army[0]!.count).toBe(6);
  });
  it(
    'la défaite donne une troupe de secours et permet de repartir',
    () => {
    const state = atCamp();
    const allies = state.battle!.units.filter((unit) => unit.side === 'ally');
    allies.forEach((unit) => {
      unit.hp = 0;
    });
    state.battle!.result = 'defeat';
    const next = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(next.army).toHaveLength(2);
    expect(next.battle).toBeNull();
    expect(key(next.hero)).toBe(key(SITES[0]!));
  });
});
describe('Sauvegardes et campagne complète', () => {
  it(
    'restaure les états d’exploration et de combat',
    () => {
    for (const state of [newGame(), atCamp()])
      {expect(loadGame(JSON.stringify(state))).toEqual(state);}
  });
  it(
    'rejette les fichiers malformés et les nombres invalides',
    () => {
    expect(loadGame('nope')).toBeNull();
    expect(loadGame(null)).toBeNull();
    for (const field of ['version', 'gold', 'castle', 'movement', 'mana']) {
      const state = { ...newGame(), [field]: -3 };
      expect(loadGame(JSON.stringify(state))).toBeNull();
    }
  });
  it(
    'rejette les identifiants inconnus et les piles de combat corrompues',
    () => {
    const state = newGame();
    state.army[0]!.creature = 'unknown';
    expect(loadGame(JSON.stringify(state))).toBeNull();
    const battleState = atCamp();
    battleState.battle!.units[0]!.hp = -10;
    expect(loadGame(JSON.stringify(battleState))).toBeNull();
  });
  it(
    'permet de gagner la campagne avec exploration, recrutement et évolutions',
    () => {
    let state = newGame();
    // Build a reserve through legal actions; no direct state boosts.
    for (let day = 0; day < 20; day++) {
      for (const family of ['sylve', 'sol'] as const)
        {state = reduce(state, { type: 'recruit', family });}
      state = reduce(state, { type: 'end-day' });
      while (state.battle) {
        state = reduce(autoBattle(state), { type: ACTION_FINISH_BATTLE });
      }
    }
    state = travel(state, 'camp1');
    state = reduce(state, { type: 'fight', site: 'camp1' });
    state = autoBattle(state);
    expect(state.battle!.result).toBe('victory');
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    state = reduce(state, {
      type: 'evolve',
      id: ARMY_SYLVE_ID,
      creature: 'sylve-druid',
    });
    state = reduce(state, {
      type: 'evolve',
      id: 'army-sol',
      creature: 'sol-star',
    });
    expect(
      state.army.every((unit) => getCreature(unit.creature).tier === 2),
    ).toBe(true);
    state = travel(state, 'camp2');
    state = reduce(state, { type: 'fight', site: 'camp2' });
    state = autoBattle(state);
    expect(state.battle!.result).toBe('victory');
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    state = reduce(state, {
      type: 'evolve',
      id: ARMY_SYLVE_ID,
      creature: 'sylve-ancient',
    });
    state = reduce(state, {
      type: 'evolve',
      id: 'army-sol',
      creature: 'sol-phoenix',
    });
    state = travel(state, 'boss');
    state = reduce(state, { type: 'fight', site: 'boss' });
    state = autoBattle(state);
    expect(state.battle!.result).toBe('victory');
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(state.won).toBe(true);
    expect(state.cleared).toEqual(['camp1', 'army2', 'camp2', 'boss']);
    expect(loadGame(JSON.stringify(state))).toEqual(state);
    expect(reduce(state, { type: 'end-day' })).toBe(state);
  });
  it(
    'toute case tactique a une coordonnée unique',
    () => {
    expect(new Set(BATTLE_TILES.map(key)).size).toBe(187);
  });
});

describe('Armées sur la carte et conquête des châteaux', () => {
  it(
    'montre des châteaux adverses et des armées accessibles',
    () => {
    expect(
      SITES.filter((site) => site.kind === 'castle' && site.difficulty),
    ).toHaveLength(2);
    const army = SITES.find((site) => site.id === 'army1')!;
    const state = newGame();
    expect(state.explored).toContain(key(army));
    const moved = reduce(state, { type: 'move', to: army });
    expect(moved.battle?.site).toBe('army1');
    expect(key(moved.hero)).toBe(key(army));
  });
  it(
    'déclenche un duel quand le héros arrive sur un héros adverse',
    () => {
    const state = newGame();
    state.hero = { q: 2, r: -3 };
    state.explored = WORLD.map(key);
    state.movement = 8;
    const foe = state.enemyHeroes!.find((hero) => hero.id === 'enemy-dusk')!;
    const moved = reduce(state, { type: 'move', to: { q: foe.q, r: foe.r } });
    expect(moved.battle?.opponent?.hero).toBe('enemy-dusk');
    expect(key(moved.hero)).toBe(key(foe));
  });
  it(
    'recrute une nouvelle ligne de troupes quand l’armée n’en avait pas',
    () => {
    let state = newGame();
    state.gold = 5000;
    state.army = state.army.filter((unit) => unit.id !== 'army-sol');
    state = reduce(state, { type: 'build', building: 'sol' });
    state = reduce(state, { type: 'end-day' });
    state = reduce(state, { type: 'recruit', family: 'sol' });
    expect(
      state.army.some((unit) => getCreature(unit.creature).family === 'sol'),
    ).toBe(true);
  });
  it(
    'intercepte le héros avant qu’il traverse une armée ennemie',
    () => {
    const state = newGame();
    state.hero = { q: -3, r: 3 };
    state.explored = WORLD.map(key);
    const moved = reduce(state, { type: 'move', to: { q: -1, r: 3 } });
    expect(moved.battle?.site).toBe('army1');
    expect(key(moved.hero)).toBe('-2,3');
    expect(moved.movement).toBe(state.movement - 1);
  });
  it('ne réengage pas une armée déjà vaincue', () => {
    const state = newGame();
    state.cleared.push('army1');
    expect(
      reduce(state, {
        type: 'move',
        to: SITES.find((site) => site.id === 'army1')!,
      })
        .battle,
    ).toBeNull();
  });
  it(
    'pose un siège sur les forteresses comme sur les châteaux ennemis',
    () => {
    let state = newGame();
    state.hero = { q: 3, r: -2 };
    state.cleared.push('camp1', 'camp2');
    state = reduce(state, { type: 'fight', site: 'boss' });
    expect(state.battle?.siege?.maxWallHp).toBe(180);
    expect(state.battle?.round).toBeGreaterThan(0);
  });
  it(
    'initialise les remparts des châteaux hors batailles de campagne',
    () => {
    const state = newGame();
    state.hero = { q: -2, r: -1 };
    const siege = reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE });
    expect(siege.battle?.siege).toEqual({ wallHp: 180, maxWallHp: 180 });
    expect(atCamp().battle?.siege).toBeUndefined();
    expect(reduce(newGame(), { type: 'catapult' })).toEqual(newGame());
  });
  it(
    'la catapulte dépense le tour et ouvre une brèche après trois tirs',
    () => {
    let state = newGame();
    state.hero = { q: -2, r: -1 };
    state = reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE });
    state.battle!.active = 'army-sol';
    state.battle!.queue = [ARMY_SYLVE_ID];
    const before = structuredClone(state);
    state = reduce(state, { type: 'catapult' });
    expect(state.battle?.siege?.wallHp).toBe(110);
    expect(state.battle?.active).toBe(ARMY_SYLVE_ID);
    expect(before.battle?.siege?.wallHp).toBe(180);
    for (let shot = 0; shot < 2; shot++) {
      state.battle!.active = 'army-sol';
      state = reduce(state, { type: 'catapult' });
    }
    expect(state.battle?.siege?.wallHp).toBe(0);
    state.battle!.active = 'army-sol';
    expect(reduce(state, { type: 'catapult' })).toBe(state);
  });
  it(
    'les murs bloquent réellement la marche avant destruction',
    () => {
    let state = newGame();
    state.hero = { q: -2, r: -1 };
    state = reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE });
    state.battle!.active = ARMY_SYLVE_ID;
    Object.assign(activeUnit(state)!, { q: 11, r: 1 });
    expect(reachable(state).some((tile) => tile.q >= 12)).toBe(false);
    state.battle!.siege!.wallHp = 0;
    expect(reachable(state).some((tile) => tile.q === 12)).toBe(true);
  });
  it(
    'une conquête change bannière, revenus et recrutement local',
    () => {
    let state = newGame();
    state.hero = { q: -2, r: -1 };
    state = reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE });
    state.battle!.result = 'victory';
    state.battle!.units.filter((unit) => unit.side === 'enemy').forEach(
      (unit) => {
        unit.hp = 0;
      },
    );
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(state.owned).toContain(SITE_SHADE_CASTLE);
    expect(income(state)).toBe(400);
    const recruited = reduce(state, { type: 'recruit', family: 'sylve' });
    expect(recruited.army[0]!.count).toBe(state.army[0]!.count + 3);
    expect(
      reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE }),
    ).toBe(state);
  });
  it(
    'permet une vraie conquête avec recrutement, catapultes et IA',
    () => {
    let state = newGame();
    for (let week = 0; week < 8; week++) {
      state = reduce(state, { type: 'recruit', family: 'sylve' });
      state = reduce(state, { type: 'recruit', family: 'sol' });
      state = reduce(state, { type: 'end-day' });
      while (state.battle) {
        state = reduce(autoBattle(state), { type: ACTION_FINISH_BATTLE });
      }
    }
    state = travel(state, SITE_SHADE_CASTLE);
    state = reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE });
    state = autoBattle(state);
    expect(state.battle?.result).toBe('victory');
    expect(state.battle?.siege?.wallHp).toBe(0);
    state = reduce(state, { type: ACTION_FINISH_BATTLE });
    expect(state.owned).toContain(SITE_SHADE_CASTLE);
    expect(state.won).toBe(false);
    const before = state.gold;
    state = reduce(state, { type: 'end-day' });
    expect(state.gold - before).toBe(income(state));
    expect(loadGame(JSON.stringify(state))).toEqual(state);
  });
  it(
    'valide les sièges et rejette les remparts corrompus en sauvegarde',
    () => {
    let state = newGame();
    state.hero = { q: -2, r: -1 };
    state = reduce(state, { type: 'fight', site: SITE_SHADE_CASTLE });
    expect(loadGame(JSON.stringify(state))).toEqual(state);
    state.battle!.siege!.wallHp = -2;
    expect(loadGame(JSON.stringify(state))).toBeNull();
  });
});
