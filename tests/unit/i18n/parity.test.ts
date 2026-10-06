import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import contentEn from '@/i18n/locales/content-en.json';
import contentFr from '@/i18n/locales/content-fr.json';
import { flattenMessageKeys } from '@/i18n/translate';

describe('i18n fr/en parity', () => {
  it('expose les mêmes clés de traduction', () => {
    const frKeys = flattenMessageKeys({
      ...fr,
      content: contentFr,
    }).sort();
    const enKeys = flattenMessageKeys({
      ...en,
      content: contentEn,
    }).sort();
    expect(enKeys).toEqual(frKeys);
  });
});
