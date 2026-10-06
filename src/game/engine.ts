import { initialOpponents, opponentRoute, type OpponentHero } from './opponent';
import {
  BUILDINGS,
  INITIAL_BUILDINGS,
  builtBuildings,
  constructionStatus,
  type BuildingId,
} from './buildings';
import {
  BATTLE_TILES,
  BATTLE_WIDTH,
  battleDistance,
  battlePathTo,
  CREATURES,
  SITES,
  WALKABLE,
  WORLD,
  distance,
  key,
  pathTo,
  type Hex,
  type Family,
} from './data';
export interface Stack {
  id: string;
  creature: string;
  count: number;
  xp: number;
}
export interface Fighter extends Stack, Hex {
  side: 'ally' | 'enemy';
  hp: number;
  maxHp: number;
  slowed: boolean;
  defending: boolean;
  waited?: boolean;
  retaliated?: boolean;
  shots?: number;
}
export interface Battle {
  site: string;
  round: number;
  units: Fighter[];
  queue: string[];
  active: string;
  result: 'victory' | 'defeat' | null;
  opponent?: { hero: string; town?: string; captureTown?: string; armyBackup?: Stack[] };
  waiting?: string[];
  spellRound?: number;
  obstacles?: Hex[];
  siege?: { wallHp: number; maxWallHp: number };
}
export interface GameState {
  version: 1;
  day: number;
  gold: number;
  crystals: number;
  mana: number;
  movement: number;
  hero: Hex;
  army: Stack[];
  owned: string[];
  cleared: string[];
  explored: string[];
  castle: number;
  built?: BuildingId[];
  buildDay?: number;
  available?: Record<Family, number>;
  enemyHeroes?: OpponentHero[];
  enemyOwned?: string[];
  enemyQueue?: string[];
  enemyGold?: number;
  enemyCrystals?: number;
  garrisons?: Record<string, Stack[]>;
  battle: Battle | null;
  won: boolean;
  log: string[];
  recruited: number;
}
export type Action =
  | { type: 'move'; to: Hex }
  | { type: 'end-day' }
  | { type: 'recruit'; family: Family }
  | { type: 'evolve'; id: string; creature: string }
  | { type: 'upgrade' }
  | { type: 'build'; building: BuildingId }
  | { type: 'fight'; site: string }
  | { type: 'fight-hero'; hero: string }
  | { type: 'battle-move'; to: Hex }
  | { type: 'attack'; target: string; from?: Hex }
  | { type: 'wait' }
  | { type: 'defend' }
  | { type: 'catapult' }
  | { type: 'spell'; spell: 'bolt' | 'heal'; target: string }
  | { type: 'enemy' }
  | { type: 'finish-battle' }
  | { type: 'retreat' };
const reveal = (s: GameState) => {
  s.explored = [
    ...new Set([...s.explored, ...WORLD.filter((t) => distance(t, s.hero) <= 2).map(key)]),
  ];
};
const log = (s: GameState, message: string) => {
  s.log = [message, ...s.log].slice(0, 18);
};
export function newGame(): GameState {
  const s: GameState = {
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
  reveal(s);
  return s;
}
export const recruitStock = (s: GameState, family: Family) =>
  s.available?.[family] ?? (family === 'sylve' ? 12 : 9);
export const weeklyGrowth = (s: GameState, family: Family) =>
  Math.round(((family === 'sylve' ? 6 : 4) * (s.castle + 1)) / 2);
export const maxMovement = (s: GameState) => 6 + s.castle;
export const maxMana = (s: GameState) => 8 + s.castle * 2;
export const income = (s: GameState) =>
  (s.owned.includes('home') ? 200 + s.castle * 50 : 0) +
  (s.owned.includes('gold') ? 150 : 0) +
  s.owned.filter((id) => ['shade-castle', 'dawn-castle'].includes(id)).length * 150;
export const friendlyTown = (s: GameState) =>
  SITES.some((p) => p.kind === 'castle' && s.owned.includes(p.id) && key(p) === key(s.hero));
export const battleGround = (s: GameState) =>
  BATTLE_TILES.filter(
    (t) =>
      !(s.battle?.siege?.wallHp && t.q === 12) &&
      !s.battle?.obstacles?.some((o) => key(o) === key(t)),
  );
export const activeUnit = (s: GameState) => s.battle?.units.find((u) => u.id === s.battle?.active);
export function canAttack(a: Fighter, b: Fighter, units: Fighter[] = []): boolean {
  if (a.side === b.side || a.hp <= 0 || b.hp <= 0) return false;
  const gap = battleDistance(a, b);
  if (gap === 1) return true;
  return (
    CREATURES[a.creature].range > 1 &&
    (a.shots ?? 12) > 0 &&
    !units.some((u) => u.hp > 0 && u.side !== a.side && battleDistance(a, u) === 1)
  );
}
export const movementRange = (a: Fighter) => (a.slowed ? 1 : CREATURES[a.creature].speed);
export const unitCount = (u: Fighter) => Math.ceil(u.hp / CREATURES[u.creature].hp);
export function damage(a: Fighter, b: Fighter): number {
  const c = CREATURES[a.creature],
    target = CREATURES[b.creature];
  const base =
    unitCount(a) *
    c.attack *
    (1 - target.defense / 25) *
    (c.ability === 'spark' && c.tier > 1 ? 1.2 : 1) *
    (c.range > 1 && (battleDistance(a, b) === 1 || battleDistance(a, b) > 8) ? 0.5 : 1);
  return Math.max(
    1,
    Math.round(base * (b.defending ? 0.55 : 1) * (target.ability === 'guard' ? 0.75 : 1)),
  );
}
export function reachable(s: GameState): Hex[] {
  const a = activeUnit(s);
  if (!a || !s.battle || s.battle.result) return [];
  const blocked = new Set(s.battle.units.filter((u) => u.hp > 0 && u.id !== a.id).map(key));
  return battleGround(s).filter((t) => {
    const p = battlePathTo(a, t, battleGround(s), blocked);
    return p.length > 0 && p.length <= movementRange(a);
  });
}
/** A melee stack can move next to its target and strike in the same turn. */
export function attackPosition(s: GameState, target: Fighter): Hex | null {
  const a = activeUnit(s);
  if (!a || a.side === target.side) return null;
  if (canAttack(a, target, s.battle!.units)) return { q: a.q, r: a.r };
  const options = reachable(s).filter((t) => battleDistance(t, target) === 1);
  const blocked = new Set(s.battle!.units.filter((u) => u.hp > 0 && u.id !== a.id).map(key));
  options.sort(
    (x, y) =>
      battlePathTo(a, x, battleGround(s), blocked).length -
      battlePathTo(a, y, battleGround(s), blocked).length,
  );
  return options[0] ?? null;
}
function updateResult(s: GameState) {
  const b = s.battle!;
  if (!b.units.some((u) => u.side === 'enemy' && u.hp > 0)) b.result = 'victory';
  else if (!b.units.some((u) => u.side === 'ally' && u.hp > 0)) b.result = 'defeat';
}
function nextTurn(s: GameState) {
  const b = s.battle!;
  updateResult(s);
  if (b.result) return;
  b.queue = b.queue.filter((id) => b.units.some((u) => u.id === id && u.hp > 0));
  if (!b.queue.length && b.waiting?.length) {
    b.queue = b.waiting
      .filter((id) => b.units.some((u) => u.id === id && u.hp > 0))
      .sort(
        (x, y) =>
          CREATURES[b.units.find((u) => u.id === x)!.creature].speed -
          CREATURES[b.units.find((u) => u.id === y)!.creature].speed,
      );
    b.waiting = [];
  }
  if (!b.queue.length) {
    b.round++;
    b.units.forEach((u) => {
      u.waited = false;
      u.retaliated = false;
    });
    b.queue = b.units
      .filter((u) => u.hp > 0)
      .sort(
        (a, z) =>
          CREATURES[z.creature].speed - CREATURES[a.creature].speed || a.id.localeCompare(z.id),
      )
      .map((u) => u.id);
  }
  b.active = b.queue.shift()!;
  const a = activeUnit(s)!;
  a.defending = false;
}
function strike(s: GameState, a: Fighter, b: Fighter) {
  const melee = battleDistance(a, b) === 1;
  const hit = damage(a, b);
  if (!melee && CREATURES[a.creature].range > 1) a.shots = Math.max(0, (a.shots ?? 12) - 1);
  b.hp = Math.max(0, b.hp - hit);
  const c = CREATURES[a.creature];
  if (c.ability === 'root') b.slowed = true;
  if (c.ability === 'heal' || c.ability === 'drain')
    a.hp = Math.min(a.maxHp, a.hp + Math.round(hit * 0.2));
  let reply = 0;
  if (melee && b.hp > 0 && !b.retaliated) {
    b.retaliated = true;
    reply = damage(b, a);
    a.hp = Math.max(0, a.hp - reply);
    if (CREATURES[b.creature].ability === 'root') a.slowed = true;
  }
  log(
    s,
    `${c.name} inflige ${hit} dégâts à ${CREATURES[b.creature].name}.${reply ? ` Riposte : ${reply} dégâts.` : ''}`,
  );
}
function startBattle(
  s: GameState,
  site: string,
  enemies?: Stack[],
  allies?: Stack[],
  defending = false,
) {
  const place = SITES.find((x) => x.id === site)!;
  const d = place.difficulty || 1;
  const foes: Stack[] =
    enemies ??
    (d === 1
      ? [
          { id: 'enemy-0', creature: 'sylve', count: 5, xp: 0 },
          { id: 'enemy-1', creature: 'sol', count: 4, xp: 0 },
        ]
      : d === 2
        ? [
            { id: 'enemy-0', creature: 'sylve-guard', count: 7, xp: 0 },
            { id: 'enemy-1', creature: 'sol-flame', count: 5, xp: 0 },
          ]
        : [
            { id: 'enemy-0', creature: 'sylve-ancient', count: 9, xp: 0 },
            { id: 'enemy-1', creature: 'sol-phoenix', count: 7, xp: 0 },
            { id: 'enemy-2', creature: 'sol-star', count: 6, xp: 0 },
          ]);
  const units: Fighter[] = [
    ...(allies ?? s.army).map((u, i) => ({
      ...u,
      q: defending ? BATTLE_WIDTH - 1 : 0,
      r: Math.min(10, 1 + i * 3),
      side: 'ally' as const,
      hp: u.count * CREATURES[u.creature].hp,
      maxHp: u.count * CREATURES[u.creature].hp,
      slowed: false,
      defending: false,
      shots: CREATURES[u.creature].range > 1 ? 12 : 0,
      waited: false,
      retaliated: false,
    })),
    ...foes.map((u, i) => ({
      ...u,
      q: defending ? 0 : BATTLE_WIDTH - 1,
      r: Math.min(10, 1 + i * 3),
      side: 'enemy' as const,
      hp: u.count * CREATURES[u.creature].hp,
      maxHp: u.count * CREATURES[u.creature].hp,
      slowed: false,
      defending: false,
      shots: CREATURES[u.creature].range > 1 ? 12 : 0,
      waited: false,
      retaliated: false,
    })),
  ];
  s.battle = {
    site,
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
  if (place.kind === 'castle' || place.kind === 'fortress')
    s.battle.siege = { wallHp: 180, maxWallHp: 180 };
  nextTurn(s);
  log(s, `${s.battle.siege ? 'Siège' : 'Bataille'} : ${place.name}.`);
}
function retreatPosition(s: GameState): Hex {
  const town = SITES.find((p) => p.kind === 'castle' && s.owned.includes(p.id));
  if (town) return { q: town.q, r: town.r };
  const tile = WALKABLE.filter((t) => !s.enemyHeroes?.some((e) => key(e) === key(t))).sort(
    (a, b) => distance(a, SITES[0]) - distance(b, SITES[0]),
  )[0];
  return { q: tile.q, r: tile.r };
}
function loseTown(s: GameState, id: string) {
  s.owned = s.owned.filter((x) => x !== id);
  s.cleared = s.cleared.filter((x) => x !== id);
  s.enemyOwned = [...new Set([...(s.enemyOwned ?? []), id])];
  if (s.garrisons) delete s.garrisons[id];
  log(
    s,
    `${SITES.find((p) => p.id === id)!.name} passe sous la bannière adverse. Vous pouvez le reconquérir.`,
  );
}
function startOpponentBattle(s: GameState, hero: OpponentHero, town?: string) {
  const captureTown = !town
    ? SITES.find((p) => p.kind === 'castle' && !s.owned.includes(p.id) && key(p) === key(hero))?.id
    : undefined;
  const remote = !!town && key(s.hero) !== key(SITES.find((p) => p.id === town)!);
  const garrison = town
    ? (s.garrisons?.[town] ?? [
        { id: 'garrison-sylve', creature: 'sylve', count: 4 + s.castle * 2, xp: 0 },
        { id: 'garrison-sol', creature: 'sol', count: 3 + s.castle, xp: 0 },
      ])
    : undefined;
  startBattle(s, town ?? captureTown ?? 'army1', hero.army, remote ? garrison : undefined, !!town);
  s.battle!.opponent = {
    hero: hero.id,
    town,
    captureTown,
    armyBackup: remote ? structuredClone(s.army) : undefined,
  };
  log(
    s,
    `${hero.name} ${town ? 'assiège ' + SITES.find((p) => p.id === town)!.name : 'attaque votre héros'} !`,
  );
}
/** Continue the persisted enemy queue after a defended battle; each leader acts once. */
function playOpponents(s: GameState) {
  while (!s.battle && s.enemyQueue?.length) {
    const id = s.enemyQueue.shift()!;
    const hero = s.enemyHeroes?.find((h) => h.id === id);
    if (!hero) continue;
    const path = opponentRoute(s, hero);
    for (const step of path) {
      hero.q = step.q;
      hero.r = step.r;
      const town = SITES.find(
        (p) => p.kind === 'castle' && s.owned.includes(p.id) && key(p) === key(hero),
      );
      if (town) {
        startOpponentBattle(s, hero, town.id);
        break;
      }
      if (key(hero) === key(s.hero)) {
        startOpponentBattle(s, hero);
        break;
      }
      const resource = SITES.find(
        (p) => ['gold', 'crystal'].includes(p.kind) && key(p) === key(hero),
      );
      if (resource && !s.enemyOwned?.includes(resource.id)) {
        s.owned = s.owned.filter((id) => id !== resource.id);
        (s.enemyOwned ??= []).push(resource.id);
        log(s, `${hero.name} capture ${resource.name}.`);
      }
    }
    if (!path.length) {
      const town = SITES.find(
        (p) => p.kind === 'castle' && s.owned.includes(p.id) && key(p) === key(hero),
      );
      if (town) startOpponentBattle(s, hero, town.id);
      else if (key(hero) === key(s.hero)) startOpponentBattle(s, hero);
    }
    if (path.length && !s.battle) log(s, `${hero.name} avance de ${path.length} case(s).`);
  }
  if (!s.battle) log(s, `Le tour adverse est terminé. À vous de jouer, jour ${s.day}.`);
}
function endOpponentDay(s: GameState) {
  s.enemyHeroes ??= initialOpponents();
  s.enemyOwned ??= ['shade-castle', 'dawn-castle', 'boss'].filter((id) => !s.owned.includes(id));
  s.enemyGold =
    (s.enemyGold ?? 450) +
    150 +
    (s.enemyOwned.includes('gold') ? 150 : 0) +
    s.enemyOwned.filter((id) => SITES.some((p) => p.id === id && p.kind === 'castle')).length * 150;
  s.enemyCrystals = (s.enemyCrystals ?? 8) + (s.enemyOwned.includes('crystal') ? 3 : 0);
  if ((s.day - 1) % 7 === 0)
    for (const hero of s.enemyHeroes)
      if (s.enemyGold >= 180) {
        s.enemyGold -= 180;
        hero.army.forEach((u, i) => (u.count += i === 0 ? 2 : 1));
      }
  s.enemyQueue = s.enemyHeroes.map((h) => h.id);
  playOpponents(s);
}
function settleOpponentBattle(s: GameState, victory: boolean, retreat = false) {
  const b = s.battle!,
    encounter = b.opponent!;
  const hero = s.enemyHeroes?.find((h) => h.id === encounter.hero);
  const survivors = (side: 'ally' | 'enemy') =>
    b.units
      .filter((u) => u.side === side && u.hp > 0)
      .map((u) => ({
        id: u.id,
        creature: u.creature,
        count: Math.max(1, Math.floor(unitCount(u) * (retreat && side === 'ally' ? 0.8 : 1))),
        xp: u.xp + (victory && side === 'ally' ? 40 : 0),
      }));
  if (encounter.armyBackup) {
    s.army = encounter.armyBackup;
    if (victory && encounter.town) (s.garrisons ??= {})[encounter.town] = survivors('ally');
  } else s.army = survivors('ally');
  if (victory) {
    if (encounter.captureTown) {
      if (!s.owned.includes(encounter.captureTown)) s.owned.push(encounter.captureTown);
      s.enemyOwned = s.enemyOwned?.filter((id) => id !== encounter.captureTown);
      if (
        SITES.some((p) => p.id === encounter.captureTown && p.difficulty > 0) &&
        !s.cleared.includes(encounter.captureTown)
      )
        s.cleared.push(encounter.captureTown);
    }
    s.enemyHeroes = (s.enemyHeroes ?? []).filter((h) => h.id !== encounter.hero);
    s.gold += 300;
    s.crystals += 4;
    log(s, `${hero?.name ?? 'Le héros adverse'} est vaincu. +300 or, +4 cristaux.`);
    const resource = SITES.find(
      (p) => key(p) === key(s.hero) && ['gold', 'crystal'].includes(p.kind),
    );
    if (resource) {
      if (!s.owned.includes(resource.id)) s.owned.push(resource.id);
      s.enemyOwned = s.enemyOwned?.filter((id) => id !== resource.id);
    }
  } else {
    if (hero) hero.army = survivors('enemy');
    if (encounter.town) loseTown(s, encounter.town);
    if (!encounter.armyBackup) {
      s.hero = retreatPosition(s);
      s.movement = 0;
      if (!s.army.length) s.army = newGame().army.map((u) => ({ ...u, count: 3 }));
    }
  }
  s.battle = null;
  reveal(s);
  playOpponents(s);
}
export function reduce(state: GameState, action: Action): GameState {
  const s: GameState = structuredClone(state);
  if (s.won) return state;
  if (!s.battle) {
    if (action.type === 'move') {
      let path = pathTo(s.hero, action.to, WALKABLE);
      const intercept = path.findIndex(
        (h) =>
          SITES.some((p) => p.kind === 'army' && key(p) === key(h) && !s.cleared.includes(p.id)) ||
          s.enemyHeroes?.some((e) => key(e) === key(h)),
      );
      if (intercept >= 0) path = path.slice(0, intercept + 1);
      if (!path.length || path.length > s.movement || !s.explored.includes(key(action.to)))
        return state;
      s.hero = { ...path[path.length - 1] };
      s.movement -= path.length;
      reveal(s);
      const site = SITES.find((p) => key(p) === key(s.hero));
      const foe = s.enemyHeroes?.find((e) => key(e) === key(s.hero));
      if (foe) {
        startOpponentBattle(s, foe);
        return s;
      }
      if (site && ['gold', 'crystal'].includes(site.kind) && !s.owned.includes(site.id)) {
        s.owned.push(site.id);
        s.enemyOwned = s.enemyOwned?.filter((id) => id !== site.id);
        log(s, `${site.name} rejoint votre royaume.`);
      }
      if (site?.kind === 'army' && !s.cleared.includes(site.id)) startBattle(s, site.id);
      if (site?.kind === 'shrine') {
        s.mana = maxMana(s);
        log(
          s,
          'La source restaure votre mana. Votre armée sera en pleine forme au prochain combat.',
        );
      }
    } else if (action.type === 'end-day') {
      s.day++;
      s.gold += income(s);
      s.crystals += s.owned.includes('crystal') ? 3 : 0;
      s.movement = maxMovement(s);
      s.mana = Math.min(maxMana(s), s.mana + 4);
      s.recruited = 0;
      if ((s.day - 1) % 7 === 0) {
        s.available = { sylve: recruitStock(s, 'sylve'), sol: recruitStock(s, 'sol') };
        for (const family of ['sylve', 'sol'] as const)
          if (builtBuildings(s).includes(family)) s.available[family] += weeklyGrowth(s, family);
        log(
          s,
          `Semaine ${Math.ceil(s.day / 7)} : de nouvelles créatures sont disponibles dans les habitations.`,
        );
      }
      log(s, `Jour ${s.day} : +${income(s)} or. Vos déplacements sont restaurés.`);
      endOpponentDay(s);
    } else if (action.type === 'recruit') {
      if (
        !friendlyTown(s) ||
        recruitStock(s, action.family) < 3 ||
        !builtBuildings(s).includes(action.family)
      )
        return state;
      const c = CREATURES[action.family],
        cost = c.gold * 3;
      if (s.gold < cost) return state;
      s.gold -= cost;
      s.recruited++;
      s.available = { sylve: recruitStock(s, 'sylve'), sol: recruitStock(s, 'sol') };
      s.available[action.family] -= 3;
      const unit = s.army.find((u) => CREATURES[u.creature].family === action.family);
      // Recruits inherit the army's trained form; evolution is an army-wide upgrade.
      if (unit) unit.count += 3;
      else s.army.push({ id: `army-${action.family}`, creature: action.family, count: 3, xp: 0 });
      log(s, `3 ${unit ? CREATURES[unit.creature].name : c.name} rejoignent votre armée.`);
    } else if (action.type === 'evolve') {
      const unit = s.army.find((u) => u.id === action.id),
        c = CREATURES[action.creature];
      if (
        !unit ||
        !c ||
        !CREATURES[unit.creature].evolves.includes(c.id) ||
        unit.xp < c.xp ||
        s.gold < c.gold ||
        s.crystals < c.crystals
      )
        return state;
      s.gold -= c.gold;
      s.crystals -= c.crystals;
      unit.creature = c.id;
      log(s, `Évolution : ${c.name} ! Toute la troupe change de forme.`);
    } else if (action.type === 'build') {
      if (
        !s.owned.includes('home') ||
        key(s.hero) !== key(SITES[0]) ||
        constructionStatus(s, action.building)
      )
        return state;
      const building = BUILDINGS.find((b) => b.id === action.building)!;
      s.gold -= building.gold;
      s.crystals -= building.crystals;
      s.built = [...builtBuildings(s), building.id];
      s.buildDay = s.day;
      if (building.id === 'sol') s.available = { sylve: recruitStock(s, 'sylve'), sol: 9 };
      if (building.id === 'guild') s.mana = maxMana(s);
      log(s, `${building.name} construit. Prochain chantier : demain.`);
    } else if (action.type === 'upgrade') {
      const cost = s.castle * 550;
      if (
        !s.owned.includes('home') ||
        key(s.hero) !== key(SITES[0]) ||
        s.castle >= 3 ||
        s.gold < cost ||
        s.crystals < 5 ||
        s.buildDay === s.day ||
        !builtBuildings(s).includes(s.castle === 1 ? 'hall' : 'forge')
      )
        return state;
      s.gold -= cost;
      s.crystals -= 5;
      s.castle++;
      s.buildDay = s.day;
      s.movement++;
      s.mana = Math.min(maxMana(s), s.mana + 2);
      log(s, `Citadelle niveau ${s.castle} : davantage de revenus, de mana et de déplacements.`);
    } else if (action.type === 'fight-hero') {
      const hero = s.enemyHeroes?.find((h) => h.id === action.hero && key(h) === key(s.hero));
      if (!hero) return state;
      startOpponentBattle(s, hero);
    } else if (action.type === 'fight') {
      const site = SITES.find((p) => p.id === action.site);
      if (
        !site ||
        (!site.difficulty && !s.enemyOwned?.includes(site.id)) ||
        key(site) !== key(s.hero) ||
        s.cleared.includes(site.id) ||
        !s.army.length ||
        (site.id === 'boss' && (!s.cleared.includes('camp1') || !s.cleared.includes('camp2')))
      )
        return state;
      startBattle(s, site.id);
    } else return state;
    return s;
  }
  const b = s.battle,
    a = activeUnit(s);
  if (action.type === 'finish-battle' && b.result) {
    if (b.opponent) {
      settleOpponentBattle(s, b.result === 'victory');
      return s;
    }
    const victory = b.result === 'victory',
      site = SITES.find((p) => p.id === b.site)!;
    s.army = b.units
      .filter((u) => u.side === 'ally' && u.hp > 0)
      .map((u) => ({
        id: u.id,
        creature: u.creature,
        count: unitCount(u),
        xp: u.xp + (victory ? (site.difficulty === 1 ? 55 : 75) : 15),
      }));
    if (victory) {
      if (site.difficulty > 0 && !s.cleared.includes(b.site)) s.cleared.push(b.site);
      s.enemyOwned = s.enemyOwned?.filter((id) => id !== b.site);
      if (site.kind === 'castle' || site.kind === 'fortress') {
        if (!s.owned.includes(site.id)) s.owned.push(site.id);
      }
      s.gold += site.difficulty === 1 ? 450 : 700;
      s.crystals += site.difficulty === 1 ? 6 : 10;
      log(s, `Victoire ! ${site.name} est libéré.`);
      if (b.site === 'boss') s.won = true;
    } else {
      s.hero = retreatPosition(s);
      if (!s.army.length)
        s.army = [
          { id: 'army-sylve', creature: 'sylve', count: 4, xp: 0 },
          { id: 'army-sol', creature: 'sol', count: 3, xp: 0 },
        ];
      log(s, 'Votre héros se replie en lieu sûr. Une petite troupe vous attend pour repartir.');
    }
    s.battle = null;
    return s;
  }
  if (action.type === 'retreat' && !b.result) {
    if (b.opponent) {
      settleOpponentBattle(s, false, true);
      return s;
    }
    s.army = b.units
      .filter((u) => u.side === 'ally' && u.hp > 0)
      .map((u) => ({
        id: u.id,
        creature: u.creature,
        count: Math.max(1, Math.floor(unitCount(u) * 0.8)),
        xp: u.xp,
      }));
    if (!s.army.length) s.army = newGame().army;
    s.hero = retreatPosition(s);
    s.movement = 0;
    s.battle = null;
    log(s, 'Retraite en lieu sûr : 20 % de votre troupe est perdue.');
    return s;
  }
  if (!a || b.result) return state;
  if (action.type === 'enemy' && a.side === 'enemy') {
    if (b.opponent?.town && b.siege?.wallHp) {
      b.siege.wallHp = Math.max(0, b.siege.wallHp - 70);
      log(s, `La catapulte adverse frappe vos remparts : ${b.siege.wallHp}/180 PV.`);
      nextTurn(s);
      return s;
    }
    const targets = b.units
      .filter((u) => u.side === 'ally' && u.hp > 0)
      .sort((x, y) => battleDistance(a, x) - battleDistance(a, y) || x.hp - y.hp);
    const target = targets.find((u) => attackPosition(s, u));
    if (target) {
      const pos = attackPosition(s, target)!;
      a.q = pos.q;
      a.r = pos.r;
      strike(s, a, target);
    } else {
      const moves = reachable(s).sort(
        (x, y) => battleDistance(x, targets[0]) - battleDistance(y, targets[0]),
      );
      if (moves.length) {
        a.q = moves[0].q;
        a.r = moves[0].r;
        log(s, `${CREATURES[a.creature].name} avance.`);
      } else a.defending = true;
    }
    a.slowed = false;
    nextTurn(s);
    return s;
  }
  if (a.side !== 'ally') return state;
  if (action.type === 'attack') {
    const target = b.units.find((u) => u.id === action.target);
    if (!target) return state;
    const pos = action.from ?? attackPosition(s, target);
    if (!pos || (key(pos) !== key(a) && !reachable(s).some((t) => key(t) === key(pos))))
      return state;
    a.q = pos.q;
    a.r = pos.r;
    if (!canAttack(a, target, b.units)) return state;
    strike(s, a, target);
  } else if (action.type === 'battle-move') {
    if (!reachable(s).some((t) => key(t) === key(action.to))) return state;
    a.q = action.to.q;
    a.r = action.to.r;
    log(s, `${CREATURES[a.creature].name} se déplace.`);
  } else if (action.type === 'catapult') {
    if (!b.siege || b.siege.wallHp === 0 || b.opponent?.town) return state;
    b.siege.wallHp = Math.max(0, b.siege.wallHp - 70);
    log(
      s,
      b.siege.wallHp
        ? `La catapulte frappe les remparts : ${b.siege.wallHp}/180 PV.`
        : 'Les remparts s’effondrent ! Le passage est ouvert.',
    );
  } else if (action.type === 'wait') {
    if (a.waited) return state;
    a.waited = true;
    (b.waiting ??= []).push(a.id);
    log(s, `${CREATURES[a.creature].name} attend la fin du tour.`);
  } else if (action.type === 'defend') {
    a.defending = true;
    log(s, `${CREATURES[a.creature].name} se protège jusqu’à son prochain tour.`);
  } else if (action.type === 'spell') {
    if (s.mana < 4 || b.spellRound === b.round || b.opponent?.armyBackup) return state;
    const target = b.units.find((u) => u.id === action.target && u.hp > 0);
    if (!target) return state;
    if (action.spell === 'bolt' && target.side === 'enemy') {
      target.hp = Math.max(0, target.hp - 70 - s.castle * 15);
      log(s, 'Éclair astral ! La cible est frappée par votre magie.');
    } else if (action.spell === 'heal' && target.side === 'ally') {
      target.hp = Math.min(target.maxHp, target.hp + 80 + s.castle * 20);
      log(s, 'Souffle de vie : la troupe récupère ses points de vie.');
    } else return state;
    s.mana -= 4;
    b.spellRound = b.round;
    updateResult(s);
    return s;
  } else return state;
  a.slowed = false;
  nextTurn(s);
  return s;
}
// Stored saves are untrusted input. Reject malformed, non-finite or incompatible values.
export function loadGame(raw: string | null): GameState | null {
  try {
    if (!raw || raw.length > 100000) return null;
    const s: GameState = JSON.parse(raw);
    const integer = (n: unknown, max = 1000000) =>
      typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
    const hex = (h: Hex) => h && Number.isInteger(h.q) && Number.isInteger(h.r);
    const stack = (u: Stack) =>
      u &&
      typeof u.id === 'string' &&
      u.id.length < 64 &&
      Object.hasOwn(CREATURES, u.creature) &&
      integer(u.count, 100000) &&
      u.count > 0 &&
      integer(u.xp);
    const ids = (a: string[], allowed: string[]) =>
      Array.isArray(a) && a.every((x) => allowed.includes(x));
    if (
      !s ||
      s.version !== 1 ||
      !integer(s.day) ||
      s.day < 1 ||
      !integer(s.gold) ||
      !integer(s.crystals) ||
      !integer(s.mana, 14) ||
      !integer(s.castle, 3) ||
      s.castle < 1 ||
      !integer(s.movement, 9) ||
      !integer(s.recruited, 100000) ||
      (s.buildDay !== undefined && (!integer(s.buildDay) || s.buildDay > s.day)) ||
      (s.built !== undefined &&
        (!ids(
          s.built,
          BUILDINGS.map((b) => b.id),
        ) ||
          new Set(s.built).size !== s.built.length ||
          !INITIAL_BUILDINGS.every((id) => s.built!.includes(id)))) ||
      (s.available !== undefined &&
        (!integer(s.available.sylve, 100000) || !integer(s.available.sol, 100000))) ||
      !hex(s.hero) ||
      !WALKABLE.some((t) => key(t) === key(s.hero)) ||
      !Array.isArray(s.army) ||
      s.army.length > 2 ||
      !s.army.every(stack) ||
      new Set(s.army.map((u) => u.id)).size !== s.army.length ||
      !ids(
        s.owned,
        SITES.map((x) => x.id),
      ) ||
      !ids(
        s.cleared,
        SITES.filter((p) => p.difficulty > 0).map((p) => p.id),
      ) ||
      !ids(s.explored, WORLD.map(key)) ||
      typeof s.won !== 'boolean' ||
      !Array.isArray(s.log) ||
      s.log.length > 18 ||
      !s.log.every((x) => typeof x === 'string' && x.length < 400)
    )
      return null;
    const opponentPlaces = SITES.filter((p) =>
      ['gold', 'crystal', 'castle', 'fortress'].includes(p.kind),
    ).map((p) => p.id);
    const armyValid = (units: Stack[]) =>
      Array.isArray(units) &&
      units.length > 0 &&
      units.length <= 2 &&
      units.every(stack) &&
      new Set(units.map((u) => u.id)).size === units.length;
    if (
      (s.enemyHeroes !== undefined &&
        (!Array.isArray(s.enemyHeroes) ||
          s.enemyHeroes.length > 2 ||
          !s.enemyHeroes.every(
            (h) =>
              typeof h.id === 'string' &&
              h.id.length < 64 &&
              typeof h.name === 'string' &&
              h.name.length < 100 &&
              hex(h) &&
              WALKABLE.some((t) => key(t) === key(h)) &&
              armyValid(h.army),
          ) ||
          new Set(s.enemyHeroes.map((h) => h.id)).size !== s.enemyHeroes.length)) ||
      (s.enemyOwned !== undefined &&
        (!ids(s.enemyOwned, opponentPlaces) || s.enemyOwned.some((id) => s.owned.includes(id)))) ||
      (s.enemyQueue !== undefined &&
        (!ids(s.enemyQueue, s.enemyHeroes?.map((h) => h.id) ?? []) ||
          new Set(s.enemyQueue).size !== s.enemyQueue.length)) ||
      (s.enemyGold !== undefined && !integer(s.enemyGold)) ||
      (s.enemyCrystals !== undefined && !integer(s.enemyCrystals)) ||
      (s.garrisons !== undefined &&
        (typeof s.garrisons !== 'object' ||
          s.garrisons === null ||
          Array.isArray(s.garrisons) ||
          !Object.entries(s.garrisons).every(
            ([id, units]) =>
              SITES.some((p) => p.id === id && p.kind === 'castle') && armyValid(units),
          )))
    )
      return null;
    if (s.battle) {
      const b = s.battle;
      if (
        b.opponent &&
        (!s.enemyHeroes?.some((h) => h.id === b.opponent!.hero) ||
          (b.opponent.town !== undefined &&
            !SITES.some((p) => p.id === b.opponent!.town && p.kind === 'castle')) ||
          (b.opponent.captureTown !== undefined &&
            !SITES.some((p) => p.id === b.opponent!.captureTown && p.kind === 'castle')) ||
          (b.opponent.armyBackup !== undefined &&
            (!b.opponent.town || !armyValid(b.opponent.armyBackup))))
      )
        return null;
      if (
        (b.waiting !== undefined && !ids(b.waiting, b.units?.map((u) => u.id) ?? [])) ||
        (b.spellRound !== undefined && (!integer(b.spellRound) || b.spellRound > b.round)) ||
        (b.obstacles !== undefined &&
          (!Array.isArray(b.obstacles) ||
            b.obstacles.length > 20 ||
            !b.obstacles.every((h) => hex(h) && BATTLE_TILES.some((t) => key(t) === key(h)))))
      )
        return null;
      if (b.siege && (!integer(b.siege.wallHp, 180) || b.siege.maxWallHp !== 180)) return null;
      // Earlier saves of the final fortress gain the siege rules when loaded.
      if (
        !b.siege &&
        SITES.some((p) => p.id === b.site && (p.kind === 'castle' || p.kind === 'fortress'))
      )
        b.siege = { wallHp: 180, maxWallHp: 180 };
      if (
        !SITES.some((p) => p.id === b.site && (p.difficulty > 0 || p.kind === 'castle')) ||
        !integer(b.round) ||
        !Array.isArray(b.units) ||
        b.units.length < 2 ||
        b.units.length > 5 ||
        !b.units.every(
          (u) =>
            stack(u) &&
            hex(u) &&
            BATTLE_TILES.some((t) => key(t) === key(u)) &&
            ['ally', 'enemy'].includes(u.side) &&
            integer(u.hp) &&
            integer(u.maxHp) &&
            u.hp <= u.maxHp &&
            u.maxHp === u.count * CREATURES[u.creature].hp &&
            typeof u.slowed === 'boolean' &&
            typeof u.defending === 'boolean' &&
            (u.shots === undefined || integer(u.shots, 12)) &&
            (u.waited === undefined || typeof u.waited === 'boolean') &&
            (u.retaliated === undefined || typeof u.retaliated === 'boolean'),
        ) ||
        new Set(b.units.map((u) => u.id)).size !== b.units.length ||
        !ids(
          b.queue,
          b.units.map((u) => u.id),
        ) ||
        !b.units.some((u) => u.id === b.active) ||
        ![null, 'victory', 'defeat'].includes(b.result)
      )
        return null;
    }
    return s;
  } catch {
    return null;
  }
}
