import type { Hex } from './hex';

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

export type Terrain = 'grass' | 'forest' | 'water' | 'mountain' | 'sand';

export interface Tile extends Hex {
  terrain: Terrain;
}

export type SiteKind =
  | 'castle'
  | 'gold'
  | 'crystal'
  | 'shrine'
  | 'camp'
  | 'fortress'
  | 'army';

export interface Site extends Hex {
  id: string;
  kind: SiteKind;
  name: string;
  description: string;
  difficulty: number;
}
