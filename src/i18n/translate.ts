import en from './locales/en.json';
import fr from './locales/fr.json';
import contentEn from './locales/content-en.json';
import contentFr from './locales/content-fr.json';

export type AppLocale = 'fr' | 'en';

const catalogs: Record<AppLocale, Record<string, unknown>> = {
  fr: { ...fr, content: contentFr },
  en: { ...en, content: contentEn },
};

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

function resolvePath(
  messages: Record<string, unknown>,
  key: string,
): unknown {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function getCatalogValue(locale: AppLocale, key: string): unknown {
  return resolvePath(catalogs[locale], key);
}

export function createTranslator(locale: AppLocale): TranslateFn {
  const messages = catalogs[locale];
  return (key, params) => {
    const value = resolvePath(messages, key);
    let text = key;
    if (typeof value === 'string') text = value;
    if (params) {
      Object.entries(params).forEach(([name, val]) => {
        text = text.replaceAll(`{${name}}`, String(val));
      });
    }
    return text;
  };
}

export function flattenMessageKeys(
  obj: Record<string, unknown>,
  prefix = '',
): string[] {
  const keys: string[] = [];
  Object.entries(obj).forEach(([name, value]) => {
    let path = name;
    if (prefix) path = `${prefix}.${name}`;
    if (typeof value === 'string') {
      keys.push(path);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (typeof entry === 'object' && entry !== null) {
          keys.push(
            ...flattenMessageKeys(
              entry as Record<string, unknown>,
              `${path}.${index}`,
            ),
          );
        }
      });
      return;
    }
    if (typeof value === 'object' && value !== null) {
      keys.push(...flattenMessageKeys(value as Record<string, unknown>, path));
    }
  });
  return keys;
}
