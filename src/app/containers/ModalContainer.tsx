import { useEffect } from 'react';
import { GameModalView } from '@/app/components/feedback/GameModalView';
import { getModalMeta } from '@/app/lib/modal-meta';
import { ModalContentContainer } from '@/app/containers/ModalContentContainer';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';

export function ModalContainer() {
  const snap = useGame();
  const { t } = useTranslation();
  const { audio, openTown } = useGameRuntime();
  const { modal, game: state, detail, trainingBackup } = snap;

  useEffect(() => {
    if (modal === 'castle') {
      openTown();
    }
  }, [modal, openTown]);

  if (!modal || modal === 'castle') {
    return <div id="modal-root" />;
  }

  const meta = getModalMeta(modal, state, trainingBackup, t);
  if (!meta) {
    return <div id="modal-root" />;
  }

  return (
    <GameModalView
      intro={meta.intro}
      open
      title={meta.title}
      wide={meta.wide}
    >
      <ModalContentContainer
        audioMuted={audio.muted}
        detail={detail}
        effectsVolume={audio.effectsVolume}
        modal={modal}
        musicVolume={audio.musicVolume}
        state={state}
        trainingBackup={trainingBackup}
      />
    </GameModalView>
  );
}
