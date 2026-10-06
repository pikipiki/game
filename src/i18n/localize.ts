import type { Creature, Site } from '@/game/data';
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
