import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { readStoredLocale } from '@/i18n/locale-storage';
import { readStoredGame, writeStoredGame } from '@/app/model/persistence';
import { soundForGameAction } from '@/app/selectors/game-action-sound';
import { createAppStore, type AppStore } from '@/app/store/app-store';
import { gameAudio } from '@/app/lib/game-audio';
import {
  RuntimeContext,
  StoreContext,
  type GameRuntime,
  type SceneInstance,
} from '@/app/providers/GameContext';
import {
  income,
  loadGame,
  newGame,
  reduce,
  type Action,
  type GameState,
} from '@/game/engine';
import { opponentStrikeToast } from '@/app/lib/opponent-alert';
import { ownedCastleAt } from '@/app/lib/town-site';
import { createTranslator } from '@/i18n/translate';
import { GameScene, type Pick } from '@/render/scene';
import type { TownScene } from '@/render/town';

/** Pause sur la carte avant le combat déclenché par l’IA (fin de journée). */
const OPPONENT_STRIKE_PAUSE_MS = 3000;

function createInitialStore(previewSandbox: boolean): AppStore {
  const stored = readStoredGame(previewSandbox);
  const game = loadGame(stored.raw) ?? newGame();
  let startModal: string | null = 'intro';
  if (stored.raw) startModal = null;
  return createAppStore({
    game,
    selected: game.hero,
    modal: startModal,
    detail: 'army-sylve',
    spell: null,
    selectedFighter: null,
    selectedBattleHex: null,
    trainingBackup: null,
    storageWorks: stored.storageWorks,
    sandbox: previewSandbox,
    resolving: false,
    opponentStrikePause: false,
    opponentStrikeBubble: null,
    townOpen: false,
    townPanel: false,
    townBuilding: 'keep',
    locale: readStoredLocale(),
  });
}

interface GameProviderProps {
  readonly mountRef: RefObject<HTMLDivElement | null>;
  readonly previewSandbox: boolean;
  readonly children: ReactNode;
}

export function GameProvider({
  mountRef,
  previewSandbox,
  children,
}: GameProviderProps) {
  const [store] = useState(() => createInitialStore(previewSandbox));
  const sceneRef = useRef<SceneInstance>(null);
  const townRef = useRef<TownScene | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [audioUiTick, setAudioUiTick] = useState(0);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastDurationMs, setToastDurationMs] = useState(3500);

  const bumpAudioUi = useCallback(() => {
    setAudioUiTick((tick) => tick + 1);
  }, []);

  const persist = useCallback(() => {
    const snap = store.getSnapshot();
    if (
      !writeStoredGame(
        snap.game,
        Boolean(snap.trainingBackup) || snap.sandbox,
      )
    ) {
      store.patch({ storageWorks: false });
    }
  }, [store]);

  const dismissToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  const toast = useCallback((message: string, durationMs = 3500) => {
    setToastMessage(message);
    setToastDurationMs(durationMs);
    setToastOpen(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastOpen(false);
    }, durationMs);
  }, []);

  const closeTown = useCallback(() => {
    townRef.current?.dispose();
    townRef.current = null;
    store.patch({ townOpen: false });
  }, [store]);

  const openTown = useCallback(() => {
    const { game } = store.getSnapshot();
    if (game.battle) {
      toast('La citadelle est inaccessible pendant une bataille.');
      return;
    }
    store.patch({
      modal: null,
      townOpen: true,
      townBuilding: 'keep',
      townPanel: false,
    });
    gameAudio.setTrack('town');
  }, [store, toast]);

  const leaveTraining = useCallback(() => {
    const snap = store.getSnapshot();
    if (!snap.trainingBackup) return;
    const restored = snap.trainingBackup;
    store.patch({
      game: restored,
      trainingBackup: null,
      selected: restored.hero,
      selectedFighter: null,
      selectedBattleHex: null,
      spell: null,
      modal: null,
    });
  }, [store]);

  const selectFighter = useCallback(
    (id: string) => {
      const state = store.getSnapshot().game;
      const alive = state.battle?.units.some(
        (unit) => unit.id === id && unit.hp > 0,
      );
      if (!alive) return;
      store.patch({ selectedFighter: id, selectedBattleHex: null });
    },
    [store],
  );

  const onPick = useCallback(
    (pick: Pick) => {
      const snap = store.getSnapshot();
      const state = snap.game;
      if (snap.modal || snap.resolving || snap.opponentStrikePause) return;
      if (state.battle) {
        if (state.battle.result) return;
        if (pick.unit) selectFighter(pick.unit);
        else if (pick.hex) {
          store.patch({ selectedBattleHex: pick.hex, selectedFighter: null });
        }
      } else if (pick.hex) {
        if (pick.doubleClick && ownedCastleAt(pick.hex, state)) {
          openTown();
          return;
        }
        store.patch({ selected: pick.hex });
      }
    },
    [store, selectFighter, openTown],
  );

  const dispatch = useCallback(
    async (action: Action) => {
      const before = store.getSnapshot();
      if (before.resolving || before.opponentStrikePause) return;
      const next = reduce(before.game, action);
      if (next === before.game) {
        toast('Cette action n’est pas disponible pour le moment.');
        return;
      }
      const t = createTranslator(before.locale);
      const strikeAlert = opponentStrikeToast(before.game, next, t);
      const deferOpponentBattle =
        Boolean(strikeAlert) &&
        action.type === 'end-day' &&
        !before.game.battle &&
        Boolean(next.battle?.opponent);
      const strikeEnemyId = next.battle?.opponent?.hero;
      if (deferOpponentBattle && strikeAlert && strikeEnemyId) {
        store.patch({
          opponentStrikePause: true,
          opponentStrikeBubble: {
            enemyId: strikeEnemyId,
            message: strikeAlert,
          },
        });
      }
      gameAudio.effect(soundForGameAction(action));
      const scene = sceneRef.current;
      if (
        scene instanceof GameScene &&
        before.game.battle &&
        next.battle &&
        [
          'attack',
          'battle-move',
          'spell',
          'defend',
          'enemy',
          'catapult',
        ].includes(action.type)
      ) {
        store.patch({ resolving: true });
        const combatButtons =
          '#combat-toolbar button, #combat-chrome button, ' +
          '.combat-sidebar-roster button, .retreat';
        const lockedButtons = [
          ...document.querySelectorAll<HTMLButtonElement>(combatButtons),
        ];
        lockedButtons.forEach((button) => {
          button.disabled = true;
        });
        const status = document.querySelector('.combat-instruction');
        if (status) status.textContent = next.log[0] ?? '';
        try {
          await scene.playAction(before.game, next, action);
        } catch (error) {
          console.warn(
            'Animation interrompue ; l’action du jeu reste appliquée.',
            error,
          );
        } finally {
          lockedButtons.forEach((button) => {
            button.disabled = false;
          });
          store.patch({ resolving: false });
        }
      }
      const gameForUi: GameState = deferOpponentBattle
        ? { ...next, battle: null }
        : next;
      store.patch({
        game: gameForUi,
        spell: null,
        selectedFighter: null,
        selectedBattleHex: null,
      });
      if (strikeAlert && !deferOpponentBattle) {
        toast(strikeAlert, OPPONENT_STRIKE_PAUSE_MS);
      } else if (action.type === 'end-day') {
        toast(
          t('alerts.endDayIncome', {
            day: before.game.day,
            gold: income(before.game),
          }),
        );
      }
      if (deferOpponentBattle) {
        await new Promise((resolve) => {
          setTimeout(resolve, OPPONENT_STRIKE_PAUSE_MS);
        });
        store.patch({
          game: next,
          opponentStrikePause: false,
          opponentStrikeBubble: null,
        });
      }
      persist();
    },
    [store, toast, persist],
  );

  const runtime = useMemo<GameRuntime>(
    () => ({
      store,
      mountRef,
      sceneRef,
      townRef,
      audio: gameAudio,
      audioUiTick,
      bumpAudioUi,
      toast,
      toastOpen,
      toastMessage,
      toastDurationMs,
      dismissToast,
      dispatch,
      persist,
      openTown,
      closeTown,
      onPick,
      selectFighter,
      leaveTraining,
    }),
    [
      store,
      mountRef,
      audioUiTick,
      bumpAudioUi,
      toast,
      toastOpen,
      toastMessage,
      toastDurationMs,
      dismissToast,
      dispatch,
      persist,
      openTown,
      closeTown,
      onPick,
      selectFighter,
      leaveTraining,
    ],
  );

  return (
    <StoreContext.Provider value={store}>
      <RuntimeContext.Provider value={runtime}>
        {children}
      </RuntimeContext.Provider>
    </StoreContext.Provider>
  );
}
