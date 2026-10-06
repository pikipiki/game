import { describe, expect, it } from 'vitest';
import { newGame } from '@/game/engine';
import { buildingNavLabel } from '@/app/lib/town-building-copy';
import { createTranslator } from '@/i18n/translate';

describe('town-building-copy', () => {
  it('affiche les noms de bâtiments en anglais', () => {
    const t = createTranslator('en');
    expect(buildingNavLabel('guild', t)).toBe('Macaron Tower');
    const state = newGame();
    expect(buildingNavLabel('keep', t)).toBe('Biscuit Castle');
  });
});
