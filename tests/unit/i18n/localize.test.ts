import { describe, expect, it } from 'vitest';
import { getCreature, SITES } from '@/game/data';
import { localizedCreature, localizedSite } from '@/i18n/localize';
import { createTranslator } from '@/i18n/translate';

describe('localize', () => {
  it('retourne les textes anglais pour un lieu et une créature', () => {
    const t = createTranslator('en');
    const home = SITES[0]!;
    expect(localizedSite(home, t).name).toBe('Pompon Citadel');
    const creature = localizedCreature(getCreature('sylve'), t);
    expect(creature.name).toBe('Beardmoss');
    expect(creature.description).toContain('green beard');
  });

  it('retombe sur le français canonique si la clé manque', () => {
    const t = createTranslator('fr');
    const home = SITES[0]!;
    expect(localizedSite(home, t).name).toBe('Citadelle de Pompon');
  });
});
