import {
  createContext,
  useContext,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import type { GameAudio } from '@/audio';
import type { AppSnapshot, AppStore } from '@/app/store/app-store';
import type { Action } from '@/game/engine';
import type { AdventureScene } from '@/render/adventure';
import type { GameScene, Pick } from '@/render/scene';
import type { TownScene } from '@/render/town';

export type SceneInstance = GameScene | AdventureScene | null;

export interface GameRuntime {
  store: AppStore;
  mountRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<SceneInstance>;
  townRef: RefObject<TownScene | null>;
  audio: GameAudio;
  audioUiTick: number;
  bumpAudioUi: () => void;
  toast: (message: string) => void;
  toastOpen: boolean;
  toastMessage: string;
  dismissToast: () => void;
  dispatch: (action: Action) => Promise<void>;
  persist: () => void;
  openTown: () => void;
  closeTown: () => void;
  onPick: (pick: Pick) => void;
  selectFighter: (id: string) => void;
  leaveTraining: () => void;
}

const StoreContext = createContext<AppStore | null>(null);
const RuntimeContext = createContext<GameRuntime | null>(null);

export function useAppStore(): AppStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useAppStore doit être utilisé dans GameProvider');
  }
  return store;
}

export function useGame(): AppSnapshot {
  const store = useAppStore();
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
}

export function useGameRuntime(): GameRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) {
    throw new Error('useGameRuntime doit être utilisé dans GameProvider');
  }
  return runtime;
}

export { StoreContext, RuntimeContext };
