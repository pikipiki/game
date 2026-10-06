import { useMemo } from 'react';
import { createTranslator } from '@/i18n/translate';
import { useGame } from '@/app/providers/GameContext';

export function useTranslation() {
  const { locale } = useGame();
  const translate = useMemo(() => createTranslator(locale), [locale]);
  return { t: translate, locale };
}
