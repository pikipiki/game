export type LocationCardAction =
  | {
      readonly kind: 'travel';
      readonly steps: number | string;
      readonly movement: number;
      readonly possible: boolean;
      readonly stepsUnitLabel: string;
      readonly moveButtonLabel: string;
    }
  | {
      readonly kind: 'fight-site';
      readonly siteId: string;
      readonly cleared: boolean;
      readonly locked: boolean;
      readonly statusLabel: string;
      readonly buttonVariant: 'gold' | 'danger';
      readonly buttonLabel: string;
    }
  | {
      readonly kind: 'castle';
      readonly castleLevel: number;
      readonly dailyGold: number;
      readonly costLine: string;
      readonly enterButtonLabel: string;
    }
  | {
      readonly kind: 'army';
      readonly banner: string;
      readonly viewArmyButtonLabel: string;
    }
  | {
      readonly kind: 'enemy-hero';
      readonly heroId: string;
      readonly heroName: string;
      readonly armyLine: string;
      readonly atHero: boolean;
      readonly possible: boolean;
      readonly buttonLabel: string;
      readonly gameAction: 'travel' | 'fight-hero';
    };

export interface LocationCardModel {
  readonly eyebrow: string;
  readonly locIcon: string;
  readonly title: string;
  readonly description: string;
  readonly action: LocationCardAction;
}
