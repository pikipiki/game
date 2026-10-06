import { getCreature, type Creature } from '@/game/data';
import type { GameState } from '@/game/engine';
import { localizedCreature } from '@/i18n/localize';
import type { TranslateFn } from '@/i18n/translate';

export function creatureLineageEyebrow(
  creature: Creature,
  t: TranslateFn,
): string {
  if (creature.family === 'sylve') return t('modals.creature.lineageSylve');
  return t('modals.creature.lineageSol');
}

export function codexFamilyEyebrow(creature: Creature, t: TranslateFn): string {
  if (creature.family === 'sylve') return t('modals.codex.familySylve');
  return t('modals.codex.familySol');
}

export function armyFamilyEyebrow(creature: Creature, t: TranslateFn): string {
  if (creature.family === 'sylve') {
    return `${t('modals.codex.familySylve')} · ${t('creature.guardian')}`;
  }
  return `${t('modals.codex.familySol')} · ${t('creature.mage')}`;
}

export function armyUnitSubtitle(
  unit: GameState['army'][number],
  creature: Creature,
  t: TranslateFn,
): string {
  const evolve = creature.evolves.some(
    (evolutionId) => unit.xp >= getCreature(evolutionId).xp,
  );
  if (evolve) return t('creature.evolutionReady');
  if (creature.range > 1) {
    return t('creature.subtitleRanged', { xp: unit.xp });
  }
  return t('creature.subtitleMelee', { xp: unit.xp });
}

export function displayCreature(creatureId: string, t: TranslateFn) {
  return localizedCreature(getCreature(creatureId), t);
}

export function codexEvolveLine(creature: Creature, t: TranslateFn): string {
  if (!creature.evolves.length) return t('modals.codex.ultimate');
  const names = creature.evolves
    .map((id) => localizedCreature(getCreature(id), t).name)
    .join(` ${t('creature.or')} `);
  return t('modals.codex.evolves', { names });
}

export function combatKindLabel(creature: Creature, t: TranslateFn): string {
  if (creature.range > 1) return t('creature.combatRanged');
  return t('creature.combatMelee');
}
