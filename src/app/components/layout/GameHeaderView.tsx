import Box from '@mui/material/Box';
import CastleIcon from '@mui/icons-material/Castle';
import SettingsIcon from '@mui/icons-material/Settings';
import { GameActionIconButton } from '@/app/components/ui/GameActionButton';
import { ResourceBarView } from '@/app/components/ui/ResourceBarView';
import type { AppLocale } from '@/i18n/translate';
import type { HeaderShellLabels } from '@/app/lib/game-copy';

const LOCALE_FLAG: Record<AppLocale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

export interface GameHeaderViewProps {
  readonly labels: HeaderShellLabels;
  readonly locale: AppLocale;
  readonly gold: string;
  readonly crystals: string;
  readonly mana: string;
  readonly soundMuted: boolean;
  readonly soundToggleLabel: string;
}

export function GameHeaderView({
  labels,
  locale,
  gold,
  crystals,
  mana,
  soundMuted,
  soundToggleLabel,
}: GameHeaderViewProps) {
  let soundClass = 'icon-btn sound-toggle';
  if (soundMuted) soundClass += ' muted';

  return (
    <Box className="header" component="header">
      <a className="brand" href="./" aria-label={labels.brandAria}>
        <CastleIcon sx={{ fontSize: 30 }} />
        <span>
          LES ROYAUMES{' '}
          <small>DE POMPON</small>
        </span>
      </a>
      <ResourceBarView crystals={crystals} gold={gold} mana={mana} />
      <GameActionIconButton
        gameAction="sound"
        aria-label={soundToggleLabel}
        className={soundClass}
      >
        ♫
      </GameActionIconButton>
      <GameActionIconButton
        gameAction="toggle-locale"
        aria-label={labels.localeToggleAria}
        className="icon-btn locale-toggle"
        title={labels.localeToggleAria}
      >
        <span aria-hidden="true">{LOCALE_FLAG[locale]}</span>
      </GameActionIconButton>
      <GameActionIconButton
        gameAction="settings"
        aria-label={labels.settingsAria}
        className="icon-btn"
      >
        <SettingsIcon fontSize="small" />
      </GameActionIconButton>
    </Box>
  );
}
