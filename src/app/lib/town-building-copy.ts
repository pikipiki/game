import { BUILDINGS, builtBuildings, constructionStatus } from '@/game/buildings';
import type { BuildingId } from '@/game/types';
import { localizedBuilding } from '@/i18n/localize';
import type { TranslateFn } from '@/i18n/translate';
import type { GameState } from '@/game/engine';

export function constructionStatusLabel(
  state: GameState,
  id: BuildingId,
  t: TranslateFn,
): string | null {
  const raw = constructionStatus(state, id);
  if (!raw) return null;
  const blueprint = BUILDINGS.find((entry) => entry.id === id);
  if (!blueprint) return t('town.build.unknown');
  if (raw === 'Déjà construit') return t('town.build.alreadyBuilt');
  if (raw === 'Ressources insuffisantes') {
    return t('town.build.insufficientResources');
  }
  if (raw === 'Un bâtiment a déjà été construit aujourd’hui') {
    return t('town.build.alreadyToday');
  }
  if (raw === 'Bâtiment inconnu') return t('town.build.unknown');
  if (raw.startsWith('Requis :')) {
    const built = builtBuildings(state);
    const missing = blueprint.requires.filter((reqId) => !built.includes(reqId));
    const names = missing
      .map((reqId) => {
        const req = BUILDINGS.find((entry) => entry.id === reqId)!;
        return localizedBuilding(req, t).name;
      })
      .join(', ');
    return t('town.build.requires', { names });
  }
  return raw;
}

export function buildingNavLabel(id: BuildingId, t: TranslateFn): string {
  const blueprint = BUILDINGS.find((entry) => entry.id === id)!;
  return localizedBuilding(blueprint, t).name;
}
