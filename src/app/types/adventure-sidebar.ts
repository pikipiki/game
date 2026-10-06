import type { LocationCardModel } from '@/app/types/location-card';

export interface MinimapCellModel {
  readonly hexQ: number;
  readonly hexR: number;
  readonly label: string;
  readonly background: string;
  readonly inner: string;
}

export interface ArmySlotModel {
  readonly kind: 'empty' | 'unit';
  readonly slot: number;
  readonly unitId?: string;
  readonly count?: number;
  readonly creatureId?: string;
  readonly ariaLabel?: string;
}

export interface AdventureSidebarViewModel {
  readonly heroCreatureId: string;
  readonly movementLine: string;
  readonly locationCard: LocationCardModel;
  readonly minimapCells: readonly MinimapCellModel[];
  readonly armySlots: readonly ArmySlotModel[];
  readonly day: number;
  readonly week: number;
  readonly dailyIncome: number;
  readonly logHead: string;
  readonly logTail: string;
  readonly enemyCount: number;
  readonly mineLabel: string;
  readonly heroTitle: string;
  readonly dayLabel: string;
  readonly weekLabel: string;
  readonly incomeLabel: string;
  readonly journalEnemies: string;
  readonly minimapAria: string;
  readonly armyAria: string;
  readonly citadelAria: string;
  readonly citadelShort: string;
}
