import { BUILDINGS } from './constants';
import type { BuildingId } from './types';

export type { BuildingId } from './types';
export { BUILDINGS, INITIAL_BUILDINGS } from './constants';

/** Missing fields denote older saves, whose existing buildings are preserved. */
export const builtBuildings = (state: { built?: BuildingId[] }) =>
  state.built ?? BUILDINGS.map((building) => building.id);

export function constructionStatus(
  state: {
    built?: BuildingId[];
    buildDay?: number;
    day: number;
    gold: number;
    crystals: number;
  },
  id: BuildingId,
): string | null {
  const blueprint = BUILDINGS.find((entry) => entry.id === id);
  if (!blueprint) return 'Bâtiment inconnu';
  const built = builtBuildings(state);
  if (built.includes(id)) return 'Déjà construit';
  const missing = blueprint.requires.filter((reqId) => !built.includes(reqId));
  if (missing.length)
    {return `Requis : ${missing.map((reqId) => BUILDINGS.find((entry) => entry.id === reqId)!.name).join(', ')}`;}
  if (state.buildDay === state.day)
    {return 'Un bâtiment a déjà été construit aujourd’hui';}
  if (state.gold < blueprint.gold || state.crystals < blueprint.crystals)
    {return 'Ressources insuffisantes';}
  return null;
}
