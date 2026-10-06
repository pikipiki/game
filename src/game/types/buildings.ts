export type BuildingId =
  | 'keep'
  | 'hall'
  | 'sylve'
  | 'sol'
  | 'guild'
  | 'tavern'
  | 'forge';

export interface BuildingBlueprint {
  id: BuildingId;
  name: string;
  subtitle: string;
  gold: number;
  crystals: number;
  requires: BuildingId[];
}
