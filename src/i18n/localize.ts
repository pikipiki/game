import type { Creature, Site } from '@/game/data';
import type { BuildingBlueprint } from '@/game/types/buildings';
import type { TranslateFn } from '@/i18n/translate';

function localizedField(
  t: TranslateFn,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  if (value === key) return fallback;
  return value;
}

export function localizedSite(
  site: Site,
  t: TranslateFn,
): { name: string; description: string } {
  const base = `content.sites.${site.id}`;
  return {
    name: localizedField(t, `${base}.name`, site.name),
    description: localizedField(t, `${base}.description`, site.description),
  };
}

export function localizedBuilding(
  blueprint: BuildingBlueprint,
  t: TranslateFn,
): { name: string; subtitle: string } {
  const base = `content.buildings.${blueprint.id}`;
  return {
    name: localizedField(t, `${base}.name`, blueprint.name),
    subtitle: localizedField(t, `${base}.subtitle`, blueprint.subtitle),
  };
}

export function localizedCreature(
  creature: Creature,
  t: TranslateFn,
): Creature {
  const base = `content.creatures.${creature.id}`;
  return {
    ...creature,
    name: localizedField(t, `${base}.name`, creature.name),
    description: localizedField(
      t,
      `${base}.description`,
      creature.description,
    ),
  };
}
