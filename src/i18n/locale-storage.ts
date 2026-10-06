import type { AppLocale } from '@/i18n/translate';

export const LOCALE_STORAGE_KEY = 'pompon-locale-v1';

export function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === 'en') return 'en';
    return 'fr';
  } catch {
    return 'fr';
  }
}

export function writeStoredLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}
