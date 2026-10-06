import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnemyScheduler } from '@/app/hooks/useEnemyScheduler';
import {
  RuntimeContext,
  StoreContext,
  type GameRuntime,
} from '@/app/providers/GameContext';
import { createAppStore } from '@/app/store/app-store';
import { newGame, reduce, type GameState } from '@/game/engine';

function enemyTurnBattle(activeId: string): GameState {
  const state = newGame();
  state.hero = { q: -1, r: -2 };
  const battle = reduce(state, { type: 'fight', site: 'camp1' });
  battle.battle!.active = activeId;
  return battle;
}

describe('useEnemyScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('replanifie un tour ennemi quand l’unité active change', () => {
    const dispatch = vi.fn().mockResolvedValue(undefined);
    let game = enemyTurnBattle('enemy-0');
    const store = createAppStore({
      game,
      selected: game.hero,
      modal: null,
      detail: 'army-sylve',
      spell: null,
      selectedFighter: null,
      selectedBattleHex: null,
      trainingBackup: null,
      storageWorks: true,
      sandbox: false,
      resolving: false,
      opponentStrikePause: false,
      opponentStrikeBubble: null,
      townOpen: false,
      townPanel: false,
      townBuilding: 'keep',
      locale: 'fr',
    });

    const runtime: GameRuntime = {
      store,
      mountRef: { current: null },
      sceneRef: { current: null },
      townRef: { current: null },
      audio: {} as GameRuntime['audio'],
      audioUiTick: 0,
      bumpAudioUi: () => {},
      toast: () => {},
      toastOpen: false,
      toastMessage: '',
      toastDurationMs: 3500,
      dismissToast: () => {},
      dispatch,
      persist: () => {},
      openTown: () => {},
      closeTown: () => {},
      onPick: () => {},
      selectFighter: () => {},
      leaveTraining: () => {},
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <StoreContext.Provider value={store}>
        <RuntimeContext.Provider value={runtime}>
          {children}
        </RuntimeContext.Provider>
      </StoreContext.Provider>
    );

    const { rerender } = renderHook(() => useEnemyScheduler(), { wrapper });

    act(() => {
      vi.advanceTimersByTime(850);
    });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'enemy' });

    game = {
      ...game,
      battle: game.battle
        ? { ...game.battle, active: 'enemy-1' }
        : game.battle,
    };
    store.patch({ game });
    rerender();

    act(() => {
      vi.advanceTimersByTime(850);
    });
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});
