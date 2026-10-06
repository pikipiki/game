import type { GameState } from '@/game/types';

export const SAVE_GAME_KEY = 'pompon-kingdom-save-v1';

export function readStoredGame(sandbox: boolean): {
  raw: string | null;
  storageWorks: boolean;
} {
  if (sandbox) return { raw: null, storageWorks: true };
  try {
    return { raw: localStorage.getItem(SAVE_GAME_KEY), storageWorks: true };
  } catch {
    return { raw: null, storageWorks: false };
  }
}

export function writeStoredGame(game: GameState, skip: boolean): boolean {
  if (skip) return true;
  try {
    localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(game));
    return true;
  } catch {
    return false;
  }
}
