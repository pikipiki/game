import { useEffect } from 'react';
import { musicTrackFor } from '@/app/lib/game-copy';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';
import { createTranslator } from '@/i18n/translate';

export function useAppShellEffects(): void {
  const snap = useGame();
  const { store, mountRef, audio, closeTown } = useGameRuntime();
  const state = snap.game;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.classList.toggle('in-battle', Boolean(state.battle));
    mount.classList.toggle('in-town', snap.townOpen);
    mount.classList.toggle('resolving', snap.resolving);
    mount.classList.toggle('opponent-strike-pause', snap.opponentStrikePause);
  }, [
    state.battle,
    snap.townOpen,
    snap.resolving,
    snap.opponentStrikePause,
    mountRef,
  ]);

  useEffect(() => {
    if (state.battle && snap.townOpen) {
      closeTown();
    }
  }, [state.battle, snap.townOpen, closeTown]);

  useEffect(() => {
    audio.setTrack(musicTrackFor(snap.townOpen, state));
  }, [snap.townOpen, state, audio]);

  useEffect(() => {
    if (state.won && snap.modal !== 'victory') {
      store.patch({ modal: 'victory' });
    }
  }, [state.won, snap.modal, store]);

  useEffect(() => {
    const t = createTranslator(snap.locale);
    document.documentElement.lang = snap.locale;
    document.title = t('meta.title');
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', t('meta.description'));
    }
  }, [snap.locale]);
}
