import type { BuildingId, GameState, Hex } from '@/game/types';
import type { AppLocale } from '@/i18n/translate';

/** État client (moteur + UI) — équivalent arbre React + `useState`. */
export interface AppSnapshot {
  game: GameState;
  selected: Hex | null;
  modal: string | null;
  detail: string;
  spell: 'bolt' | 'heal' | null;
  selectedFighter: string | null;
  selectedBattleHex: Hex | null;
  trainingBackup: GameState | null;
  storageWorks: boolean;
  sandbox: boolean;
  resolving: boolean;
  townOpen: boolean;
  townPanel: boolean;
  townBuilding: BuildingId;
  locale: AppLocale;
}

export type AppStoreListener = () => void;

export interface AppStore {
  getSnapshot: () => AppSnapshot;
  subscribe: (listener: AppStoreListener) => () => void;
  /** Mise à jour partielle (comme `setState` / `useReducer` dispatch UI). */
  patch: (partial: Partial<AppSnapshot>) => void;
  /** Remplace l’état de partie (après `reduce` ou import). */
  setGame: (game: GameState) => void;
}

export function createAppStore(initial: AppSnapshot): AppStore {
  let snapshot = initial;
  const listeners = new Set<AppStoreListener>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    patch: (partial) => {
      snapshot = { ...snapshot, ...partial };
      notify();
    },
    setGame: (game) => {
      snapshot = { ...snapshot, game };
      notify();
    },
  };
}
