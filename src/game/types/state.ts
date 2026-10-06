import type { BuildingId } from './buildings';
import type { Family } from './world';
import type { Hex } from './hex';
import type { OpponentHero } from './opponent';
import type { Stack } from './stack';

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
  opponent?: {
    hero: string;
    town?: string;
    captureTown?: string;
    armyBackup?: Stack[];
  };
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
