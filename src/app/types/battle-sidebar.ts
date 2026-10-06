import type { FighterPanelModel } from '@/game/battle/presentation';

export interface BattleResultSidebarModel {
  readonly kind: 'result';
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}

export interface BattleFighterSidebarModel {
  readonly kind: 'fighter';
  readonly panel: FighterPanelModel;
}

export type BattleSidebarModel =
  | BattleResultSidebarModel
  | BattleFighterSidebarModel;
