import type { GameState } from '@/game/engine';
import type { TranslateFn } from '@/i18n/translate';

export interface ModalMeta {
  title: string;
  wide: boolean;
  intro: boolean;
}

/* eslint-disable sonarjs/cognitive-complexity -- table de routage modales */
export function getModalMeta(
  modal: string,
  state: GameState,
  trainingBackup: GameState | null,
  t: TranslateFn,
): ModalMeta | null {
  if (modal === 'castle') return null;
  if (modal === 'intro') {
    return {
      title: t('modals.intro.title'),
      wide: false,
      intro: true,
    };
  }
  if (modal === 'army') {
    return { title: t('modals.army.title'), wide: false, intro: false };
  }
  if (modal === 'creature') {
    return { title: t('modals.creature.title'), wide: true, intro: false };
  }
  if (modal === 'codex') {
    return { title: t('modals.codex.title'), wide: true, intro: false };
  }
  if (modal === 'help') {
    return { title: t('modals.help.title'), wide: false, intro: false };
  }
  if (modal === 'destinations') {
    return { title: t('modals.destinations.title'), wide: false, intro: false };
  }
  if (modal === 'tactical-moves') {
    return { title: t('modals.tactical.title'), wide: false, intro: false };
  }
  if (modal === 'audio') {
    return { title: t('modals.audio.title'), wide: false, intro: false };
  }
  if (modal === 'settings') {
    return { title: t('modals.settings.title'), wide: false, intro: false };
  }
  if (modal === 'restart') {
    return { title: t('modals.restart.title'), wide: false, intro: false };
  }
  if (modal === 'victory') {
    return { title: t('modals.victory.title'), wide: false, intro: false };
  }
  if (modal === 'retreat' && trainingBackup) {
    return {
      title: t('modals.retreat.trainingTitle'),
      wide: false,
      intro: false,
    };
  }
  if (modal === 'retreat' && state.battle?.opponent?.armyBackup) {
    return {
      title: t('modals.retreat.castleTitle'),
      wide: false,
      intro: false,
    };
  }
  if (modal === 'retreat') {
    return {
      title: t('modals.retreat.defaultTitle'),
      wide: false,
      intro: false,
    };
  }
  return null;
}
