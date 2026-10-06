import type { TranslateFn } from '@/i18n/translate';

export interface CreatureStatLabels {
  readonly hp: string;
  readonly attack: string;
  readonly defense: string;
  readonly combatKind: string;
}

export function creatureStatLabels(t: TranslateFn): CreatureStatLabels {
  return {
    hp: t('creature.statHp'),
    attack: t('creature.statAttack'),
    defense: t('creature.statDefense'),
    combatKind: t('creature.statCombat'),
  };
}
