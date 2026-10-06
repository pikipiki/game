import { maxMovement, type GameState } from '@/game/engine';
import { battleTitle } from '@/game/opponent';
import type { TranslateFn } from '@/i18n/translate';

export type MusicTrack = 'town' | 'battle' | 'adventure';

export function musicTrackFor(
  townOpen: boolean,
  state: GameState,
): MusicTrack {
  if (townOpen) return 'town';
  if (state.battle) return 'battle';
  return 'adventure';
}

export interface WebglErrorCopy {
  readonly title: string;
  readonly body: string;
}

export function webglErrorCopy(t: TranslateFn): WebglErrorCopy {
  return {
    title: t('errors.webglTitle'),
    body: t('errors.webglBody'),
  };
}

export function soundToggleAria(muted: boolean, t: TranslateFn): string {
  if (muted) return t('header.soundOff');
  return t('header.soundOn');
}

export interface MapHeadingCopy {
  regionTag: string;
  title: string;
  subtitle: string;
}

export function mapHeadingCopy(
  state: GameState,
  t: TranslateFn,
): MapHeadingCopy {
  if (state.battle) {
    return {
      regionTag: t('map.battleTag'),
      title: battleTitle(state),
      subtitle: t('map.battleSubtitle', { round: state.battle.round }),
    };
  }
  return {
    regionTag: t('map.campaignTag'),
    title: t('map.campaignTitle'),
    subtitle: t('map.campaignSubtitle'),
  };
}

export function saveIndicatorLabel(
  storageWorks: boolean,
  sandbox: boolean,
  t: TranslateFn,
): { status: string; unsaved: boolean } {
  if (sandbox) {
    return { status: t('footer.savePreview'), unsaved: false };
  }
  if (!storageWorks) {
    return { status: t('footer.saveUnavailable'), unsaved: true };
  }
  return { status: t('footer.saveAuto'), unsaved: false };
}

export function adventureCaptionMovement(
  state: GameState,
  t: TranslateFn,
): string {
  return t('map.movement', {
    current: state.movement,
    max: maxMovement(state),
  });
}

export interface FooterShellLabels {
  navAria: string;
  explore: string;
  army: string;
  castle: string;
  codex: string;
  helpAria: string;
  endDay: string;
}

export function footerShellLabels(
  t: TranslateFn,
  day: number,
): FooterShellLabels {
  return {
    navAria: t('footer.navAria'),
    explore: t('footer.explore'),
    army: t('footer.army'),
    castle: t('footer.castle'),
    codex: t('footer.codex'),
    helpAria: t('footer.helpAria'),
    endDay: t('footer.endDay', { day }),
  };
}

export interface HeaderShellLabels {
  brandAria: string;
  settingsAria: string;
  localeToggleAria: string;
}

export function headerShellLabels(
  t: TranslateFn,
  locale: 'fr' | 'en',
): HeaderShellLabels {
  const localeToggleAria =
    locale === 'fr' ? t('header.localeToggleToEn') : t('header.localeToggleToFr');
  return {
    brandAria: t('header.brand'),
    settingsAria: t('header.settingsAria'),
    localeToggleAria,
  };
}

export interface WorldShellLabels {
  worldAria: string;
  zoomIn: string;
  zoomOut: string;
  recenter: string;
  destinations: string;
  tacticalGrid: string;
  retreat: string;
  training: string;
  allyLegend: string;
  enemyLegend: string;
  dragTipPan: string;
  dragTipEnemies: string;
  initiativeBarAria: string;
  combatToolbarAria: string;
}

export function worldShellLabels(t: TranslateFn): WorldShellLabels {
  return {
    worldAria: t('map.worldAria'),
    zoomIn: t('map.zoomIn'),
    zoomOut: t('map.zoomOut'),
    recenter: t('map.recenter'),
    destinations: t('map.destinations'),
    tacticalGrid: t('map.tacticalGrid'),
    retreat: t('map.retreat'),
    training: t('map.training'),
    allyLegend: t('map.allyLegend'),
    enemyLegend: t('map.enemyLegend'),
    dragTipPan: t('map.dragTipPan'),
    dragTipEnemies: t('map.dragTipEnemies'),
    initiativeBarAria: t('map.initiativeBarAria'),
    combatToolbarAria: t('map.combatToolbarAria'),
  };
}

export interface TownScreenLabels {
  screenAria: string;
  realmTag: string;
  goldTitle: string;
  crystalsTitle: string;
  audioAria: string;
  backToMap: string;
  sceneTitle: string;
  sceneHint: string;
  zoomInAria: string;
  zoomOutAria: string;
  recenterAria: string;
  viewTip: string;
  navAria: string;
  mobileArmyEyebrow: string;
  mobileArmyTip: string;
  dayLabel: string;
  incomeFooter: string;
  garrisonLabel: string;
  nextDay: string;
  enterBuildingAria: (name: string) => string;
}

export function townScreenLabels(t: TranslateFn, day: number, gold: number) {
  const labels: TownScreenLabels = {
    screenAria: t('town.screen.aria'),
    realmTag: t('town.screen.realmTag'),
    goldTitle: t('town.screen.goldTitle'),
    crystalsTitle: t('town.screen.crystalsTitle'),
    audioAria: t('town.screen.audioAria'),
    backToMap: t('town.screen.backToMap'),
    sceneTitle: t('town.screen.sceneTitle'),
    sceneHint: t('town.screen.sceneHint'),
    zoomInAria: t('town.screen.zoomInAria'),
    zoomOutAria: t('town.screen.zoomOutAria'),
    recenterAria: t('town.screen.recenterAria'),
    viewTip: t('town.screen.viewTip'),
    navAria: t('town.screen.navAria'),
    mobileArmyEyebrow: t('town.screen.mobileArmyEyebrow'),
    mobileArmyTip: t('town.screen.mobileArmyTip'),
    dayLabel: t('town.screen.dayLabel', { day }),
    incomeFooter: t('town.screen.incomeFooter', { gold }),
    garrisonLabel: t('town.screen.garrisonLabel'),
    nextDay: t('town.screen.nextDay'),
    enterBuildingAria: (name: string) =>
      t('town.screen.enterBuildingAria', { name }),
  };
  return labels;
}
