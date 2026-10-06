import Box from '@mui/material/Box';
import { useMemo } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { getCatalogValue } from '@/i18n/translate';

interface HelpStep {
  readonly title: string;
  readonly body: string;
}

export function HelpModalView() {
  const { locale } = useTranslation();
  const steps = useMemo(() => {
    const raw = getCatalogValue(locale, 'modals.help.steps');
    if (!Array.isArray(raw)) return [];
    return raw as HelpStep[];
  }, [locale]);

  return (
    <Box className="help-steps">
      {steps.map((step, index) => (
        <div key={step.title}>
          <b>{String(index + 1).padStart(2, '0')}</b>
          <section>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </section>
        </div>
      ))}
    </Box>
  );
}
