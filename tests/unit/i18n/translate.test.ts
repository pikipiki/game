import { describe, expect, it } from 'vitest';
import {
  createTranslator,
  flattenMessageKeys,
  getCatalogValue,
} from '@/i18n/translate';
import fr from '@/i18n/locales/fr.json';

describe('translate', () => {
  it('résout les clés imbriquées et les paramètres', () => {
    const t = createTranslator('fr');
    expect(t('footer.endDay', { day: 3 })).toContain('3');
    expect(getCatalogValue('fr', 'modals.help.steps')).toBeTruthy();
    expect(flattenMessageKeys(fr).length).toBeGreaterThan(50);
  });

  it('échappe les paramètres interpolés', () => {
    const t = createTranslator('fr');
    const text = t('location.castleLevel', {
      level: '<x>',
      gold: '1&2',
    });
    expect(text).toContain('&lt;x&gt;');
    expect(text).toContain('1&amp;2');
    expect(text).not.toContain('<x>');
  });
});
