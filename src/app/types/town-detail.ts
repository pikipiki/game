import type { BuildingId } from '@/render/town';

export interface TownDetailHeading {
  readonly subtitle: string;
  readonly title: string;
  readonly closeAria: string;
}

export interface TownHallProjectModel {
  readonly id: BuildingId;
  readonly name: string;
  readonly subtitle: string;
  readonly costLine: string;
  readonly built: boolean;
  readonly reasonText: string | null;
  readonly buildDisabled: boolean;
  readonly buildLabel: string;
}

export type TownDetailBody =
  | {
      readonly kind: 'keep';
      readonly title: string;
      readonly lead: string;
      readonly fortLabel: string;
      readonly levelLine: string;
      readonly incomeLabel: string;
      readonly incomeLine: string;
      readonly conquerText: string;
      readonly buildCitadelLabel: string;
    }
  | {
      readonly kind: 'guild';
      readonly title: string;
      readonly manaLine: string;
      readonly boltTitle: string;
      readonly boltDesc: string;
      readonly healTitle: string;
      readonly healDesc: string;
      readonly manaRestore: string;
    }
  | {
      readonly kind: 'hall';
      readonly projectsTitle: string;
      readonly projectsLead: string;
      readonly dayNotice: string;
      readonly projects: readonly TownHallProjectModel[];
      readonly fortTitle: string;
      readonly fortBonus: string;
      readonly upgradeCost: string;
      readonly upgradeLabel: string;
      readonly upgradeDisabled: boolean;
      readonly homeNote: string | null;
    }
  | {
      readonly kind: 'recruit';
      readonly family: string;
      readonly creatureName: string;
      readonly description: string;
      readonly perPurchaseLabel: string;
      readonly perPurchaseCount: string;
      readonly stockLabel: string;
      readonly stock: number;
      readonly costLine: string;
      readonly recruitLabel: string;
      readonly recruitDisabled: boolean;
      readonly growthFine: string;
      readonly combatKindValue: string;
    }
  | {
      readonly kind: 'forge';
      readonly title: string;
      readonly lead: string;
      readonly codexLabel: string;
      readonly unitIds: readonly string[];
    }
  | {
      readonly kind: 'heroHall';
      readonly title: string;
      readonly lead: string;
      readonly logHead: string;
      readonly unitIds: readonly string[];
    }
  | {
      readonly kind: 'unbuilt';
      readonly title: string;
      readonly lead: string;
      readonly costLine: string;
      readonly reasonText: string;
      readonly buildDisabled: boolean;
      readonly buildLabel: string;
      readonly buildBuildingId: BuildingId;
    };

export interface TownDetailModel {
  readonly heading: TownDetailHeading;
  readonly travelNotice: string | null;
  readonly body: TownDetailBody;
}
