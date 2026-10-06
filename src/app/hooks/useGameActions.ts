import { useEffect } from 'react';
import { selectBattleSelection } from '@/app/selectors/battle-selection';
import { writeStoredLocale } from '@/i18n/locale-storage';
import { useGameRuntime } from '@/app/providers/GameContext';
import { SITES } from '@/game/data';
import { battleControls } from '@/game/battle/controls';
import { loadGame, newGame, reduce } from '@/game/engine';
import type { BuildingId } from '@/render/town';

export function useGameActions(): void {
  const runtime = useGameRuntime();
  const {
    mountRef,
    store,
    sceneRef,
    townRef,
    audio,
    bumpAudioUi,
    toast,
    dispatch,
    persist,
    openTown,
    closeTown,
    selectFighter,
    leaveTraining,
  } = runtime;

  useEffect(() => {
    persist();
  }, [persist]);

  useEffect(() => {
    // eslint-disable-next-line sonarjs/cognitive-complexity -- routage data-action
    const onClick = (event: MouseEvent) => {
      const origin = event.target as HTMLElement;
      if (!origin.closest('#app, .MuiDialog-root')) return;
      const liveSnap = store.getSnapshot();
      const state = liveSnap.game;
      const battleSelection = selectBattleSelection(liveSnap);
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-action]',
      );
      if (!button || button.hasAttribute('disabled')) return;
      const actionName = button.dataset.action;
      const mapOnlyWhilePaused =
        liveSnap.opponentStrikePause &&
        !['zoom-in', 'zoom-out', 'camera'].includes(actionName ?? '');
      if (
        mapOnlyWhilePaused ||
        (liveSnap.resolving &&
          !['zoom-in', 'zoom-out', 'camera'].includes(actionName ?? ''))
      ) {
        return;
      }
      if (actionName === 'backdrop' && event.target !== button) return;
      if (actionName === 'castle') {
        openTown();
        return;
      }
      if (actionName === 'leave-town') {
        closeTown();
        return;
      }
      if (actionName === 'town-building') {
        store.patch({
          townBuilding: button.dataset.id as BuildingId,
          townPanel: true,
        });
        return;
      }
      if (actionName === 'town-close-panel') {
        store.patch({ townPanel: false });
        return;
      }
      if (actionName === 'town-zoom-in' || actionName === 'town-zoom-out') {
        let zoomDelta = -0.12;
        if (actionName === 'town-zoom-in') zoomDelta = 0.12;
        townRef.current?.setZoom(zoomDelta);
        return;
      }
      if (actionName === 'town-camera') {
        townRef.current?.resetCamera();
        return;
      }
      if (actionName === 'zoom-in') {
        sceneRef.current?.setZoom(0.15);
        return;
      }
      if (actionName === 'zoom-out') {
        sceneRef.current?.setZoom(-0.15);
        return;
      }
      if (actionName === 'camera') {
        sceneRef.current?.resetCamera();
        return;
      }
      if (
        actionName === 'close' ||
        actionName === 'backdrop' ||
        actionName === 'map'
      ) {
        store.patch({ modal: null });
        return;
      }
      if (actionName === 'training') {
        if (state.battle) return;
        const practice = newGame();
        practice.hero = { q: -1, r: -2 };
        const leadStack = practice.army[0];
        const secondStack = practice.army[1];
        if (leadStack) leadStack.count = 12;
        if (secondStack) secondStack.count = 9;
        store.patch({
          trainingBackup: state,
          game: reduce(practice, { type: 'fight', site: 'camp1' }),
          selectedFighter: null,
          selectedBattleHex: null,
          spell: null,
          modal: null,
        });
        return;
      }
      if (actionName === 'select-fighter') {
        selectFighter(button.dataset.id!);
        return;
      }
      if (actionName === 'select-cell') {
        store.patch({
          selectedBattleHex: {
            q: Number(button.dataset.q),
            r: Number(button.dataset.r),
          },
          selectedFighter: null,
          modal: null,
        });
        return;
      }
      if (
        actionName === 'confirm-move' ||
        actionName === 'confirm-attack' ||
        actionName === 'confirm-spell'
      ) {
        const controls = battleControls(state, battleSelection);
        if (
          actionName === 'confirm-move' &&
          controls.move &&
          liveSnap.selectedBattleHex
        ) {
          void dispatch({
            type: 'battle-move',
            to: liveSnap.selectedBattleHex,
          });
        } else if (
          actionName === 'confirm-attack' &&
          controls.attack &&
          liveSnap.selectedFighter
        ) {
          void dispatch({
            type: 'attack',
            target: liveSnap.selectedFighter,
            from: controls.approach ?? undefined,
          });
        } else if (
          actionName === 'confirm-spell' &&
          controls.cast &&
          liveSnap.selectedFighter &&
          liveSnap.spell
        ) {
          void dispatch({
            type: 'spell',
            spell: liveSnap.spell,
            target: liveSnap.selectedFighter,
          });
        }
        return;
      }
      if (actionName === 'sound') {
        audio.toggle();
        bumpAudioUi();
        return;
      }
      if (actionName === 'locale-fr') {
        writeStoredLocale('fr');
        store.patch({ locale: 'fr' });
        return;
      }
      if (actionName === 'locale-en') {
        writeStoredLocale('en');
        store.patch({ locale: 'en' });
        return;
      }
      if (actionName === 'toggle-locale') {
        const next = store.getSnapshot().locale === 'fr' ? 'en' : 'fr';
        writeStoredLocale(next);
        store.patch({ locale: next });
        return;
      }
      if (actionName === 'audio-settings') {
        store.patch({ modal: 'audio' });
        return;
      }
      if (actionName === 'wait') {
        void dispatch({ type: 'wait' });
        return;
      }
      if (actionName === 'minimap') {
        store.patch({
          selected: {
            q: Number(button.dataset.q),
            r: Number(button.dataset.r),
          },
        });
        return;
      }
      if (actionName === 'step') {
        const nextHex = {
          q: Number(button.dataset.q),
          r: Number(button.dataset.r),
        };
        store.patch({ selected: nextHex });
        void dispatch({ type: 'move', to: nextHex });
        return;
      }
      if (actionName === 'destination') {
        const site = SITES.find(
          (siteEntry) => siteEntry.id === button.dataset.id,
        )!;
        store.patch({
          selected: { q: site.q, r: site.r },
          modal: null,
        });
        return;
      }
      if (actionName === 'travel' && liveSnap.selected) {
        void dispatch({ type: 'move', to: liveSnap.selected });
        return;
      }
      if (actionName === 'end-day') {
        void dispatch({ type: 'end-day' });
        return;
      }
      if (actionName === 'fight-hero') {
        void dispatch({ type: 'fight-hero', hero: button.dataset.id! });
        return;
      }
      if (actionName === 'fight') {
        void dispatch({ type: 'fight', site: button.dataset.id! });
        return;
      }
      if (actionName === 'recruit') {
        void dispatch({
          type: 'recruit',
          family: button.dataset.id as 'sylve' | 'sol',
        });
        return;
      }
      if (actionName === 'evolve') {
        void dispatch({
          type: 'evolve',
          id: button.dataset.id!,
          creature: button.dataset.creature!,
        });
        toast('Votre troupe a évolué !');
        return;
      }
      if (actionName === 'build') {
        void dispatch({
          type: 'build',
          building: button.dataset.id as BuildingId,
        });
        return;
      }
      if (actionName === 'upgrade') {
        void dispatch({ type: 'upgrade' });
        return;
      }
      if (actionName === 'catapult') {
        void dispatch({ type: 'catapult' });
        return;
      }
      if (actionName === 'defend') {
        void dispatch({ type: 'defend' });
        return;
      }
      if (actionName === 'finish-battle') {
        if (liveSnap.trainingBackup) {
          leaveTraining();
          return;
        }
        void dispatch({ type: 'finish-battle' });
        store.patch({ selected: state.hero });
        return;
      }
      if (actionName === 'bolt' || actionName === 'heal') {
        let nextSpell: 'bolt' | 'heal' | null = 'bolt';
        if (actionName === 'heal') nextSpell = 'heal';
        if (liveSnap.spell === nextSpell) nextSpell = null;
        store.patch({ spell: nextSpell });
        return;
      }
      if (actionName === 'confirm-retreat') {
        if (liveSnap.trainingBackup) {
          leaveTraining();
          return;
        }
        store.patch({ modal: null });
        void dispatch({ type: 'retreat' });
        store.patch({ selected: state.hero });
        return;
      }
      if (actionName === 'confirm-restart') {
        if (liveSnap.townOpen) {
          townRef.current?.dispose();
          townRef.current = null;
          store.patch({ townOpen: false });
        }
        const fresh = newGame();
        store.patch({
          townOpen: false,
          trainingBackup: null,
          game: fresh,
          selected: fresh.hero,
          modal: null,
          spell: null,
        });
        persist();
        return;
      }
      if (actionName === 'creature') {
        store.patch({
          detail: button.dataset.id!,
          modal: 'creature',
        });
        return;
      }
      if (actionName === 'export') {
        const blob = new Blob(
          [JSON.stringify(liveSnap.trainingBackup ?? state, null, 2)],
          {
            type: 'application/json',
          },
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pompon-jour-${state.day}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('Sauvegarde exportée.');
        return;
      }
      if (actionName === 'import') {
        document.querySelector<HTMLInputElement>('#import')!.click();
        return;
      }
      if (
        [
          'army',
          'castle',
          'codex',
          'settings',
          'help',
          'restart',
          'retreat',
          'destinations',
          'tactical-moves',
        ].includes(actionName ?? '')
      ) {
        store.patch({ modal: actionName! });
        document.querySelector<HTMLElement>('.modal')?.focus();
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [
    store,
    sceneRef,
    townRef,
    audio,
    bumpAudioUi,
    toast,
    dispatch,
    persist,
    openTown,
    closeTown,
    selectFighter,
    leaveTraining,
  ]);

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('#import');
    if (!input) return;
    const onChange = async (changeEvent: Event) => {
      const target = changeEvent.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      if (file.size > 100000) {
        toast('Fichier trop volumineux.');
        target.value = '';
        return;
      }
      const loaded = loadGame(await file.text());
      if (!loaded) {
        toast('Cette sauvegarde est invalide ou incompatible.');
        target.value = '';
        return;
      }
      store.patch({
        trainingBackup: null,
        selectedFighter: null,
        selectedBattleHex: null,
        game: loaded,
        selected: loaded.hero,
        modal: null,
        spell: null,
      });
      persist();
      toast('Aventure restaurée.');
      target.value = '';
    };
    input.addEventListener('change', onChange);
    return () => input.removeEventListener('change', onChange);
  }, [store, toast, persist]);

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      const liveSnap = store.getSnapshot();
      if (liveSnap.resolving) return;
      if (keyEvent.key === 'Escape') {
        if (liveSnap.townOpen && !liveSnap.modal) {
          closeTown();
          return;
        }
        store.patch({ modal: null, spell: null });
      }
      if (keyEvent.key === 'Tab' && liveSnap.modal) {
        const buttons = [
          ...document.querySelectorAll<HTMLElement>(
            '.modal button:not([disabled]), .modal [tabindex="0"]',
          ),
        ];
        if (!buttons.length) return;
        const first = buttons[0]!;
        const last = buttons.at(-1)!;
        if (
          keyEvent.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === document.querySelector('.modal'))
        ) {
          keyEvent.preventDefault();
          last.focus();
        } else if (
          !keyEvent.shiftKey &&
          document.activeElement === last
        ) {
          keyEvent.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store, closeTown]);

  useEffect(() => {
    const root = mountRef.current;
    if (!root) return;
    const onInput = (event: Event) => {
      const input = event.target as HTMLInputElement;
      const kind = input.dataset.audio;
      if (kind === 'music' || kind === 'effects') {
        audio.setVolume(kind, Number(input.value) / 100);
      }
    };
    root.addEventListener('input', onInput);
    return () => root.removeEventListener('input', onInput);
  }, [mountRef, audio]);
}
