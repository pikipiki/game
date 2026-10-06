export type Family = 'sylve' | 'sol';
export interface Creature {
  id: string;
  name: string;
  family: Family;
  tier: number;
  color: string;
  accent: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  ability: 'root' | 'heal' | 'guard' | 'spark' | 'drain';
  description: string;
  evolves: string[];
  gold: number;
  crystals: number;
  xp: number;
}
export const CREATURES: Record<string, Creature> = {
  sylve: {
    id: 'sylve',
    name: 'Barbemousse',
    family: 'sylve',
    tier: 1,
    color: '#8056c7',
    accent: '#57c598',
    hp: 24,
    attack: 8,
    defense: 3,
    speed: 3,
    range: 1,
    ability: 'root',
    description:
      'Un petit gardien à la barbe verte. Ses racines ralentissent la cible après une attaque.',
    evolves: ['sylve-guard', 'sylve-druid'],
    gold: 70,
    crystals: 0,
    xp: 0,
  },
  'sylve-guard': {
    id: 'sylve-guard',
    name: 'Gardien des bois',
    family: 'sylve',
    tier: 2,
    color: '#5e4da1',
    accent: '#57e2be',
    hp: 38,
    attack: 11,
    defense: 8,
    speed: 3,
    range: 1,
    ability: 'guard',
    description: 'Une armure de feuilles et un cœur de chêne. Réduit les dégâts de 25 %.',
    evolves: ['sylve-ancient'],
    gold: 240,
    crystals: 4,
    xp: 45,
  },
  'sylve-druid': {
    id: 'sylve-druid',
    name: 'Druide émeraude',
    family: 'sylve',
    tier: 2,
    color: '#6a53ba',
    accent: '#72ead0',
    hp: 29,
    attack: 13,
    defense: 4,
    speed: 4,
    range: 3,
    ability: 'heal',
    description:
      'Sa barbe lumineuse canalise la forêt. Récupère des points de vie après chaque attaque.',
    evolves: ['sylve-ancient'],
    gold: 240,
    crystals: 4,
    xp: 45,
  },
  'sylve-ancient': {
    id: 'sylve-ancient',
    name: 'Ancêtre de Sylve',
    family: 'sylve',
    tier: 3,
    color: '#574386',
    accent: '#92ffcf',
    hp: 52,
    attack: 19,
    defense: 9,
    speed: 4,
    range: 3,
    ability: 'heal',
    description:
      'Des bois majestueux, une magie ancienne. Puissant gardien capable de se régénérer.',
    evolves: [],
    gold: 480,
    crystals: 9,
    xp: 120,
  },
  sol: {
    id: 'sol',
    name: 'Pompon solaire',
    family: 'sol',
    tier: 1,
    color: '#cb66c3',
    accent: '#ffd657',
    hp: 18,
    attack: 9,
    defense: 2,
    speed: 4,
    range: 3,
    ability: 'spark',
    description:
      'Sa houppe jaune crépite de magie. Tire des étincelles sur le champ de bataille, avec une pénalité à longue distance.',
    evolves: ['sol-flame', 'sol-star'],
    gold: 85,
    crystals: 0,
    xp: 0,
  },
  'sol-flame': {
    id: 'sol-flame',
    name: 'Crête de braise',
    family: 'sol',
    tier: 2,
    color: '#dd78a4',
    accent: '#ff9b49',
    hp: 27,
    attack: 16,
    defense: 3,
    speed: 5,
    range: 3,
    ability: 'spark',
    description:
      'Une crête ardente et des étincelles plus fortes. Ses attaques infligent 20 % de dégâts supplémentaires.',
    evolves: ['sol-phoenix'],
    gold: 260,
    crystals: 4,
    xp: 45,
  },
  'sol-star': {
    id: 'sol-star',
    name: 'Oracle étoilé',
    family: 'sol',
    tier: 2,
    color: '#9e72dc',
    accent: '#fff0a0',
    hp: 26,
    attack: 13,
    defense: 5,
    speed: 5,
    range: 4,
    ability: 'drain',
    description:
      'Lit les constellations et absorbe la lumière. Ses attaques restaurent une partie de ses points de vie.',
    evolves: ['sol-phoenix'],
    gold: 260,
    crystals: 4,
    xp: 45,
  },
  'sol-phoenix': {
    id: 'sol-phoenix',
    name: 'Phénix d’aurore',
    family: 'sol',
    tier: 3,
    color: '#d086d9',
    accent: '#ffdd88',
    hp: 40,
    attack: 23,
    defense: 6,
    speed: 6,
    range: 4,
    ability: 'drain',
    description: 'Couronné de plumes et d’ailes dorées. La forme ultime des Pompons solaires.',
    evolves: [],
    gold: 500,
    crystals: 9,
    xp: 120,
  },
};
export interface Hex {
  q: number;
  r: number;
}
export type Terrain = 'grass' | 'forest' | 'water' | 'mountain' | 'sand';
export interface Tile extends Hex {
  terrain: Terrain;
}
export type SiteKind = 'castle' | 'gold' | 'crystal' | 'shrine' | 'camp' | 'fortress' | 'army';
export interface Site extends Hex {
  id: string;
  kind: SiteKind;
  name: string;
  description: string;
  difficulty: number;
}
export const SITES: Site[] = [
  {
    id: 'home',
    q: -3,
    r: 2,
    kind: 'castle',
    name: 'Citadelle de Pompon',
    description:
      'Le cœur de votre royaume. Recrutez, bâtissez et préparez vos prochaines aventures.',
    difficulty: 0,
  },
  {
    id: 'gold',
    q: -2,
    r: 0,
    kind: 'gold',
    name: 'Mine de miel doré',
    description: 'Capturez la mine : +150 or chaque jour.',
    difficulty: 0,
  },
  {
    id: 'crystal',
    q: 0,
    r: 2,
    kind: 'crystal',
    name: 'Jardin de cristaux',
    description: 'Capturez le jardin : +3 cristaux chaque jour.',
    difficulty: 0,
  },
  {
    id: 'spring',
    q: 1,
    r: 0,
    kind: 'shrine',
    name: 'Source des murmures',
    description: 'Une source enchantée restaure votre mana et soigne toute votre armée.',
    difficulty: 0,
  },
  {
    id: 'camp1',
    q: -1,
    r: -2,
    kind: 'camp',
    name: 'Clairière oubliée',
    description:
      'Des créatures égarées gardent un trésor. Victoire : 450 or, 6 cristaux, +55 expérience.',
    difficulty: 1,
  },
  {
    id: 'camp2',
    q: 2,
    r: 1,
    kind: 'camp',
    name: 'Vestiges de l’aurore',
    description:
      'Une troupe aguerrie défend ces ruines. Victoire : 700 or, 10 cristaux, +75 expérience.',
    difficulty: 2,
  },
  {
    id: 'shade-castle',
    q: -2,
    r: -1,
    kind: 'castle',
    difficulty: 1,
    name: 'Château des Brumes',
    description:
      'Une garnison ennemie garde ses remparts. Assiégez le château pour le conquérir : +150 or par jour et recrutement sur place.',
  },
  {
    id: 'dawn-castle',
    q: 3,
    r: 0,
    kind: 'castle',
    difficulty: 2,
    name: 'Château de l’Aurore',
    description:
      'Les tours du Crépuscule dominent la vallée. Conquérez ce château fortifié : +150 or par jour et recrutement sur place.',
  },
  {
    id: 'army1',
    q: -2,
    r: 3,
    kind: 'army',
    difficulty: 1,
    name: 'La bande des Ronces',
    description:
      'Une armée ennemie barre le chemin. Rejoignez sa case pour engager le combat : 450 or, 6 cristaux et 55 XP.',
  },
  {
    id: 'army2',
    q: 1,
    r: -2,
    kind: 'army',
    difficulty: 2,
    name: 'La garde du Crépuscule',
    description:
      'Des créatures évoluées occupent le passage. Défaites cette armée : 700 or, 10 cristaux et 75 XP.',
  },
  {
    id: 'boss',
    q: 3,
    r: -2,
    kind: 'fortress',
    name: 'Forteresse du Crépuscule',
    description:
      'Battez le Seigneur du Crépuscule après les deux camps pour rendre sa lumière au royaume.',
    difficulty: 3,
  },
];
export const key = (h: Hex) => `${h.q},${h.r}`;
export const distance = (a: Hex, b: Hex) =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
export const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: -1, r: 1 },
];
export const WORLD: Tile[] = [];
for (let q = -4; q <= 4; q++)
  for (let r = -4; r <= 4; r++) {
    if (distance({ q, r }, { q: 0, r: 0 }) > 4) continue;
    let terrain: Terrain = 'grass';
    if ((q === -4 && r < 2) || (r === 4 && q > -2)) terrain = 'water';
    else if ((q === 0 && r === -3) || (q === 1 && r === -3) || (q === -1 && r === 4))
      terrain = 'mountain';
    else if ((q * 7 + r * 13 + 37) % 4 === 0) terrain = 'forest';
    else if (q > 1 && r < 1) terrain = 'sand';
    if (SITES.some((s) => s.q === q && s.r === r)) terrain = 'grass';
    WORLD.push({ q, r, terrain });
  }
export const BATTLE_WIDTH = 17;
export const BATTLE_HEIGHT = 11;
export const BATTLE_TILES: Hex[] = Array.from({ length: BATTLE_WIDTH * BATTLE_HEIGHT }, (_, i) => ({
  q: i % BATTLE_WIDTH,
  r: Math.floor(i / BATTLE_WIDTH),
}));
export const battleAxial = (h: Hex): Hex => ({ q: h.q - Math.floor(h.r / 2), r: h.r });
export const battleDistance = (a: Hex, b: Hex) => distance(battleAxial(a), battleAxial(b));
export const battleNeighbors = (h: Hex) => {
  const a = battleAxial(h);
  return DIRECTIONS.map((d) => ({
    q: a.q + d.q + Math.floor((a.r + d.r) / 2),
    r: a.r + d.r,
  })).filter((t) => t.q >= 0 && t.q < BATTLE_WIDTH && t.r >= 0 && t.r < BATTLE_HEIGHT);
};
export function battlePathTo(from: Hex, to: Hex, tiles: Hex[], blocked = new Set<string>()): Hex[] {
  const allowed = new Set(tiles.map(key)),
    queue: Hex[][] = [[from]],
    seen = new Set([key(from)]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i],
      last = path[path.length - 1];
    if (key(last) === key(to)) return path.slice(1);
    for (const next of battleNeighbors(last))
      if (allowed.has(key(next)) && !blocked.has(key(next)) && !seen.has(key(next))) {
        seen.add(key(next));
        queue.push([...path, next]);
      }
  }
  return [];
}
export function pathTo(from: Hex, to: Hex, tiles: Hex[], blocked: Set<string> = new Set()): Hex[] {
  const allowed = new Set(tiles.map(key));
  const queue: Hex[][] = [[from]],
    seen = new Set([key(from)]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i],
      last = path[path.length - 1];
    if (key(last) === key(to)) return path.slice(1);
    for (const d of DIRECTIONS) {
      const next = { q: last.q + d.q, r: last.r + d.r },
        k = key(next);
      if (allowed.has(k) && !blocked.has(k) && !seen.has(k)) {
        seen.add(k);
        queue.push([...path, next]);
      }
    }
  }
  return [];
}
export const WALKABLE = WORLD.filter((t) => t.terrain !== 'water' && t.terrain !== 'mountain');
