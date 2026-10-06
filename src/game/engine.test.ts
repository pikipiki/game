import { describe, expect, it } from 'vitest';
import {
  BATTLE_TILES,
  battleDistance,
  CREATURES,
  SITES,
  WALKABLE,
  WORLD,
  distance,
  key,
  pathTo,
} from './data';
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
} from './engine';

function atCamp(): GameState {
  const s = newGame();
  s.hero = { q: -1, r: -2 };
  return reduce(s, { type: 'fight', site: 'camp1' });
}
function allyTurn(): GameState {
  let s = atCamp();
  while (activeUnit(s)?.side === 'enemy') s = reduce(s, { type: 'enemy' });
  return s;
}
function autoBattle(start: GameState): GameState {
  let s = start;
  for (let i = 0; i < 600 && !s.battle?.result; i++) {
    const a = activeUnit(s)!;
    if (a.side === 'enemy') {
      s = reduce(s, { type: 'enemy' });
      continue;
    }
    if (s.battle?.siege?.wallHp && !s.battle.opponent?.town) {
      s = reduce(s, { type: 'catapult' });
      continue;
    }
    const enemies = s.battle!.units.filter((u) => u.side === 'enemy' && u.hp > 0);
    const target = enemies
      .filter((e) => canAttack(a, e, s.battle!.units))
      .sort((x, y) => x.hp - y.hp)[0];
    if (target) {
      s = reduce(s, { type: 'attack', target: target.id });
      continue;
    }
    const moves = reachable(s).sort(
      (x, y) =>
        Math.min(...enemies.map((e) => battleDistance(x, e))) -
        Math.min(...enemies.map((e) => battleDistance(y, e))),
    );
    s = reduce(s, moves.length ? { type: 'battle-move', to: moves[0] } : { type: 'defend' });
  }
  expect(s.battle?.result).not.toBeNull();
  return s;
}
function travel(start: GameState, site: string): GameState {
  let s = start;
  const target = SITES.find((x) => x.id === site)!;
  for (let i = 0; i < 30 && key(s.hero) !== key(target); i++) {
    if (s.battle) {
      s = reduce(autoBattle(s), { type: 'finish-battle' });
      continue;
    }
    const path = pathTo(s.hero, target, WALKABLE);
    if (s.movement === 0) {
      s = reduce(s, { type: 'end-day' });
      continue;
    }
    s = reduce(s, { type: 'move', to: path[0] });
  }
  expect(key(s.hero)).toBe(key(target));
  return s;
}

describe('Hexagones et carte', () => {
  it('calcule la distance hexagonale et les voisins', () => {
    expect(distance({ q: 0, r: 0 }, { q: 1, r: -1 })).toBe(1);
    expect(distance({ q: -3, r: 2 }, { q: 3, r: -2 })).toBe(6);
  });
  it('relie chaque lieu sans traverser les obstacles', () => {
    for (const site of SITES.slice(1)) {
      const path = pathTo(SITES[0], site, WALKABLE);
      expect(path.length).toBeGreaterThan(0);
      expect(path.every((t) => WALKABLE.some((w) => key(w) === key(t)))).toBe(true);
    }
  });
  it('respecte les cases bloquées et les destinations hors carte', () => {
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
  it('commence avec les deux familles des photos', () => {
    const s = newGame();
    expect(s.army.map((u) => u.creature)).toEqual(['sylve', 'sol']);
    expect(s.explored).toContain(key(s.hero));
  });
  it('ne modifie jamais l’état précédent', () => {
    const s = newGame(),
      snapshot = JSON.stringify(s);
    reduce(s, { type: 'end-day' });
    expect(JSON.stringify(s)).toBe(snapshot);
  });
  it('dépense les pas et révèle la brume', () => {
    const s = newGame(),
      next = reduce(s, { type: 'move', to: { q: -2, r: 2 } });
    expect(next.movement).toBe(s.movement - 1);
    expect(next.explored.length).toBeGreaterThan(s.explored.length);
  });
  it('interdit la téléportation, l’eau et les terres non révélées', () => {
    const s = newGame();
    expect(reduce(s, { type: 'move', to: { q: 3, r: -2 } })).toBe(s);
    expect(reduce(s, { type: 'move', to: { q: -4, r: 1 } })).toBe(s);
    s.movement = 0;
    expect(reduce(s, { type: 'move', to: { q: -2, r: 2 } })).toBe(s);
  });
  it('capture une mine et cumule les revenus au prochain jour', () => {
    let s = travel(newGame(), 'gold');
    expect(s.owned).toContain('gold');
    const before = s.gold;
    s = reduce(s, { type: 'end-day' });
    expect(s.gold - before).toBe(400);
    expect(income(s)).toBe(400);
  });
  it('les cristaux capturés produisent 3 unités par jour', () => {
    let s = travel(newGame(), 'crystal');
    const before = s.crystals;
    s = reduce(s, { type: 'end-day' });
    expect(s.crystals - before).toBe(3);
  });
  it('la source restaure le mana sans dépasser le maximum', () => {
    let s = newGame();
    s.mana = 0;
    s = travel(s, 'spring');
    expect(s.mana).toBe(maxMana(s));
  });
  it('recrute par lots de trois jusqu’à épuisement du stock hebdomadaire', () => {
    let s = newGame();
    s.gold = 10000;
    for (let i = 0; i < 4; i++) s = reduce(s, { type: 'recruit', family: 'sylve' });
    expect(s.army[0].count).toBe(20);
    expect(reduce(s, { type: 'recruit', family: 'sylve' })).toBe(s);
    s = reduce(s, { type: 'end-day' });
    expect(s.recruited).toBe(0);
  });
  it('interdit le recrutement à distance ou sans or', () => {
    const s = newGame();
    s.gold = 0;
    expect(reduce(s, { type: 'recruit', family: 'sol' })).toBe(s);
    s.gold = 1000;
    s.hero = { q: 0, r: 0 };
    expect(reduce(s, { type: 'recruit', family: 'sol' })).toBe(s);
  });
  it('améliore le château, ses revenus et ses capacités', () => {
    let s = newGame();
    s = reduce(s, { type: 'upgrade' });
    expect(s.castle).toBe(2);
    expect(s.gold).toBe(500);
    expect(s.crystals).toBe(7);
    expect(s.movement).toBe(8);
    expect(income(s)).toBe(300);
  });
});
describe('Évolutions', () => {
  it('chaque variante appartient à une branche de sa famille', () => {
    for (const c of Object.values(CREATURES))
      for (const id of c.evolves) {
        expect(CREATURES[id].family).toBe(c.family);
        expect(CREATURES[id].tier).toBe(c.tier + 1);
      }
  });
  it('refuse une évolution sans expérience', () => {
    const s = newGame();
    expect(reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sylve-guard' })).toBe(s);
  });
  it('évolue toute la troupe et déduit les ressources', () => {
    const s = newGame();
    s.army[0].xp = 55;
    const next = reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sylve-druid' });
    expect(next.army[0].creature).toBe('sylve-druid');
    expect(next.army[0].count).toBe(8);
    expect(next.gold).toBe(s.gold - 240);
    expect(next.crystals).toBe(s.crystals - 4);
  });
  it('refuse les branches étrangères et les sauts de niveau', () => {
    const s = newGame();
    s.army[0].xp = 500;
    expect(reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sol-star' })).toBe(s);
    expect(reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sylve-ancient' })).toBe(s);
  });
  it('les nouvelles recrues héritent de la variante choisie', () => {
    let s = newGame();
    s.army[0].xp = 60;
    s = reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sylve-guard' });
    s = reduce(s, { type: 'recruit', family: 'sylve' });
    expect(s.army[0].creature).toBe('sylve-guard');
    expect(s.army[0].count).toBe(11);
  });
});
describe('Combats tactiques', () => {
  it('empêche le combat à distance et ferme la forteresse avant les camps', () => {
    const s = newGame();
    expect(reduce(s, { type: 'fight', site: 'camp1' })).toBe(s);
    s.hero = { q: 3, r: -2 };
    expect(reduce(s, { type: 'fight', site: 'boss' })).toBe(s);
  });
  it('initialise une file de tours ordonnée par la vitesse', () => {
    const s = atCamp(),
      a = activeUnit(s)!;
    expect(CREATURES[a.creature].speed).toBe(4);
    expect(s.battle!.units).toHaveLength(4);
    expect(s.battle!.round).toBe(1);
  });
  it('bloque les actions alliées pendant un tour ennemi', () => {
    const s = atCamp();
    s.battle!.active = 'enemy-0';
    expect(reduce(s, { type: 'defend' })).toBe(s);
  });
  it('avance uniquement vers une case accessible et termine le tour', () => {
    const s = allyTurn(),
      a = activeUnit(s)!,
      moves = reachable(s);
    expect(moves.length).toBeGreaterThan(0);
    const next = reduce(s, { type: 'battle-move', to: moves[0] });
    expect(key(next.battle!.units.find((u) => u.id === a.id)!)).toBe(key(moves[0]));
    expect(next.battle!.active).not.toBe(a.id);
  });
  it('ne traverse pas une troupe et refuse une case lointaine', () => {
    const s = allyTurn();
    expect(
      reachable(s).some((t) => s.battle!.units.some((u) => u.hp > 0 && key(u) === key(t))),
    ).toBe(false);
    expect(reduce(s, { type: 'battle-move', to: { q: 7, r: 4 } })).toBe(s);
  });
  it('calcule les dégâts selon la troupe, la défense et la protection', () => {
    const s = allyTurn(),
      a = activeUnit(s)!,
      target = s.battle!.units.find((u) => u.side === 'enemy')!;
    const base = damage(a, target);
    target.defending = true;
    expect(damage(a, target)).toBeLessThan(base);
    expect(damage(a, target)).toBeGreaterThan(0);
  });
  it('refuse une attaque sur un allié ou un tireur sans munitions', () => {
    const s = allyTurn(),
      a = activeUnit(s)!;
    expect(reduce(s, { type: 'attack', target: a.id })).toBe(s);
    a.shots = 0;
    expect(reduce(s, { type: 'attack', target: 'enemy-0' })).toBe(s);
  });
  it('un sort consomme du mana et conserve le tour de la troupe', () => {
    const s = allyTurn(),
      a = activeUnit(s)!,
      next = reduce(s, { type: 'spell', spell: 'bolt', target: 'enemy-0' });
    expect(next.mana).toBe(s.mana - 4);
    expect(next.battle!.units.find((u) => u.id === 'enemy-0')!.hp).toBe(35);
    expect(next.battle!.active).toBe(a.id);
    expect(reduce(next, { type: 'spell', spell: 'bolt', target: 'enemy-1' })).toBe(next);
  });
  it('refuse un sort sans mana ou sur le mauvais camp', () => {
    const s = allyTurn();
    s.mana = 3;
    expect(reduce(s, { type: 'spell', spell: 'bolt', target: 'enemy-0' })).toBe(s);
    s.mana = 10;
    expect(reduce(s, { type: 'spell', spell: 'heal', target: 'enemy-0' })).toBe(s);
  });
  it('l’IA agit et l’exploration reste bloquée pendant le combat', () => {
    const s = atCamp();
    s.battle!.active = 'enemy-0';
    const next = reduce(s, { type: 'enemy' });
    expect(next).not.toBe(s);
    expect(next.battle!.active).not.toBe('enemy-0');
    expect(reduce(next, { type: 'end-day' })).toBe(next);
  });
  it('une victoire accorde ressources et expérience une seule fois', () => {
    let s = atCamp();
    s.army.forEach((u) => (u.count = 35));
    s.battle!.units.filter((u) => u.side === 'ally').forEach((u) => {
      u.count = 35;
      u.hp = u.maxHp = 35 * CREATURES[u.creature].hp;
    });
    s = autoBattle(s);
    expect(s.battle!.result).toBe('victory');
    const gold = s.gold;
    s = reduce(s, { type: 'finish-battle' });
    expect(s.gold).toBe(gold + 450);
    expect(s.army.every((u) => u.xp === 55)).toBe(true);
    expect(s.cleared).toContain('camp1');
    expect(reduce(s, { type: 'fight', site: 'camp1' })).toBe(s);
  });
  it('la retraite revient au château avec des pertes', () => {
    const s = atCamp(),
      next = reduce(s, { type: 'retreat' });
    expect(next.battle).toBeNull();
    expect(key(next.hero)).toBe(key(SITES[0]));
    expect(next.movement).toBe(0);
    expect(next.army[0].count).toBe(6);
  });
  it('la défaite donne une troupe de secours et permet de repartir', () => {
    const s = atCamp();
    s.battle!.units.filter((u) => u.side === 'ally').forEach((u) => (u.hp = 0));
    s.battle!.result = 'defeat';
    const next = reduce(s, { type: 'finish-battle' });
    expect(next.army).toHaveLength(2);
    expect(next.battle).toBeNull();
    expect(key(next.hero)).toBe(key(SITES[0]));
  });
});
describe('Sauvegardes et campagne complète', () => {
  it('restaure les états d’exploration et de combat', () => {
    for (const s of [newGame(), atCamp()]) expect(loadGame(JSON.stringify(s))).toEqual(s);
  });
  it('rejette les fichiers malformés, les versions inconnues et les nombres invalides', () => {
    expect(loadGame('nope')).toBeNull();
    expect(loadGame(null)).toBeNull();
    for (const field of ['version', 'gold', 'castle', 'movement', 'mana']) {
      const s = { ...newGame(), [field]: -3 };
      expect(loadGame(JSON.stringify(s))).toBeNull();
    }
  });
  it('rejette les identifiants inconnus et les piles de combat corrompues', () => {
    const s = newGame();
    s.army[0].creature = 'unknown';
    expect(loadGame(JSON.stringify(s))).toBeNull();
    const b = atCamp();
    b.battle!.units[0].hp = -10;
    expect(loadGame(JSON.stringify(b))).toBeNull();
  });
  it('permet de gagner la campagne avec exploration, recrutement et évolutions', () => {
    let s = newGame();
    // Build a reserve through legal actions; no direct state boosts.
    for (let day = 0; day < 20; day++) {
      for (const family of ['sylve', 'sol'] as const) s = reduce(s, { type: 'recruit', family });
      s = reduce(s, { type: 'end-day' });
      while (s.battle) s = reduce(autoBattle(s), { type: 'finish-battle' });
    }
    s = travel(s, 'camp1');
    s = reduce(s, { type: 'fight', site: 'camp1' });
    s = autoBattle(s);
    expect(s.battle!.result).toBe('victory');
    s = reduce(s, { type: 'finish-battle' });
    s = reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sylve-druid' });
    s = reduce(s, { type: 'evolve', id: 'army-sol', creature: 'sol-star' });
    expect(s.army.every((u) => CREATURES[u.creature].tier === 2)).toBe(true);
    s = travel(s, 'camp2');
    s = reduce(s, { type: 'fight', site: 'camp2' });
    s = autoBattle(s);
    expect(s.battle!.result).toBe('victory');
    s = reduce(s, { type: 'finish-battle' });
    s = reduce(s, { type: 'evolve', id: 'army-sylve', creature: 'sylve-ancient' });
    s = reduce(s, { type: 'evolve', id: 'army-sol', creature: 'sol-phoenix' });
    s = travel(s, 'boss');
    s = reduce(s, { type: 'fight', site: 'boss' });
    s = autoBattle(s);
    expect(s.battle!.result).toBe('victory');
    s = reduce(s, { type: 'finish-battle' });
    expect(s.won).toBe(true);
    expect(s.cleared).toEqual(['camp1', 'army2', 'camp2', 'boss']);
    expect(loadGame(JSON.stringify(s))).toEqual(s);
    expect(reduce(s, { type: 'end-day' })).toBe(s);
  });
  it('toute case tactique a une coordonnée unique', () => {
    expect(new Set(BATTLE_TILES.map(key)).size).toBe(187);
  });
});

describe('Armées sur la carte et conquête des châteaux', () => {
  it('montre des châteaux adverses et des armées accessibles', () => {
    expect(SITES.filter((p) => p.kind === 'castle' && p.difficulty).length).toBe(2);
    const army = SITES.find((p) => p.id === 'army1')!;
    const s = newGame();
    expect(s.explored).toContain(key(army));
    const moved = reduce(s, { type: 'move', to: army });
    expect(moved.battle?.site).toBe('army1');
    expect(key(moved.hero)).toBe(key(army));
  });
  it('intercepte le héros avant qu’il traverse une armée ennemie', () => {
    const s = newGame();
    s.hero = { q: -3, r: 3 };
    s.explored = WORLD.map(key);
    const moved = reduce(s, { type: 'move', to: { q: -1, r: 3 } });
    expect(moved.battle?.site).toBe('army1');
    expect(key(moved.hero)).toBe('-2,3');
    expect(moved.movement).toBe(s.movement - 1);
  });
  it('ne réengage pas une armée déjà vaincue', () => {
    const s = newGame();
    s.cleared.push('army1');
    expect(reduce(s, { type: 'move', to: SITES.find((p) => p.id === 'army1')! }).battle).toBeNull();
  });
  it('initialise les remparts des châteaux, sans les mettre dans les batailles de campagne', () => {
    const s = newGame();
    s.hero = { q: -2, r: -1 };
    const siege = reduce(s, { type: 'fight', site: 'shade-castle' });
    expect(siege.battle?.siege).toEqual({ wallHp: 180, maxWallHp: 180 });
    expect(atCamp().battle?.siege).toBeUndefined();
    expect(reduce(newGame(), { type: 'catapult' })).toEqual(newGame());
  });
  it('la catapulte dépense le tour et ouvre une brèche après trois tirs', () => {
    let s = newGame();
    s.hero = { q: -2, r: -1 };
    s = reduce(s, { type: 'fight', site: 'shade-castle' });
    s.battle!.active = 'army-sol';
    s.battle!.queue = ['army-sylve'];
    const before = structuredClone(s);
    s = reduce(s, { type: 'catapult' });
    expect(s.battle?.siege?.wallHp).toBe(110);
    expect(s.battle?.active).toBe('army-sylve');
    expect(before.battle?.siege?.wallHp).toBe(180);
    for (let i = 0; i < 2; i++) {
      s.battle!.active = 'army-sol';
      s = reduce(s, { type: 'catapult' });
    }
    expect(s.battle?.siege?.wallHp).toBe(0);
    s.battle!.active = 'army-sol';
    expect(reduce(s, { type: 'catapult' })).toBe(s);
  });
  it('les murs bloquent réellement la marche avant destruction', () => {
    let s = newGame();
    s.hero = { q: -2, r: -1 };
    s = reduce(s, { type: 'fight', site: 'shade-castle' });
    s.battle!.active = 'army-sylve';
    Object.assign(activeUnit(s)!, { q: 11, r: 1 });
    expect(reachable(s).some((p) => p.q >= 12)).toBe(false);
    s.battle!.siege!.wallHp = 0;
    expect(reachable(s).some((p) => p.q === 12)).toBe(true);
  });
  it('une conquête change la bannière, les revenus et permet de recruter sur place', () => {
    let s = newGame();
    s.hero = { q: -2, r: -1 };
    s = reduce(s, { type: 'fight', site: 'shade-castle' });
    s.battle!.result = 'victory';
    s.battle!.units.filter((u) => u.side === 'enemy').forEach((u) => (u.hp = 0));
    s = reduce(s, { type: 'finish-battle' });
    expect(s.owned).toContain('shade-castle');
    expect(income(s)).toBe(400);
    const recruited = reduce(s, { type: 'recruit', family: 'sylve' });
    expect(recruited.army[0].count).toBe(s.army[0].count + 3);
    expect(reduce(s, { type: 'fight', site: 'shade-castle' })).toBe(s);
  });
  it('permet une vraie conquête avec recrutement, catapultes et IA', () => {
    let s = newGame();
    for (let i = 0; i < 8; i++) {
      s = reduce(s, { type: 'recruit', family: 'sylve' });
      s = reduce(s, { type: 'recruit', family: 'sol' });
      s = reduce(s, { type: 'end-day' });
      while (s.battle) s = reduce(autoBattle(s), { type: 'finish-battle' });
    }
    s = travel(s, 'shade-castle');
    s = reduce(s, { type: 'fight', site: 'shade-castle' });
    s = autoBattle(s);
    expect(s.battle?.result).toBe('victory');
    expect(s.battle?.siege?.wallHp).toBe(0);
    s = reduce(s, { type: 'finish-battle' });
    expect(s.owned).toContain('shade-castle');
    expect(s.won).toBe(false);
    const before = s.gold;
    s = reduce(s, { type: 'end-day' });
    expect(s.gold - before).toBe(income(s));
    expect(loadGame(JSON.stringify(s))).toEqual(s);
  });
  it('valide les nouveaux sièges et rejette les remparts corrompus dans les sauvegardes', () => {
    let s = newGame();
    s.hero = { q: -2, r: -1 };
    s = reduce(s, { type: 'fight', site: 'shade-castle' });
    expect(loadGame(JSON.stringify(s))).toEqual(s);
    s.battle!.siege!.wallHp = -2;
    expect(loadGame(JSON.stringify(s))).toBeNull();
  });
});
