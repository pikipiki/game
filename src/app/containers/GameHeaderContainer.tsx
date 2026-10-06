import { GameHeaderView } from '@/app/components/layout/GameHeaderView';
import { formatNumber } from '@/app/lib/format';
import {
  headerShellLabels,
  soundToggleAria,
} from '@/app/lib/game-copy';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';
import { maxMana } from '@/game/engine';

export function GameHeaderContainer() {
  const snap = useGame();
  const { t } = useTranslation();
  const { audio } = useGameRuntime();
  const state = snap.game;

  return (
    <GameHeaderView
      crystals={formatNumber(state.crystals)}
      gold={formatNumber(state.gold)}
      labels={headerShellLabels(t, snap.locale)}
      locale={snap.locale}
      mana={`${state.mana}/${maxMana(state)}`}
      soundMuted={audio.muted}
      soundToggleLabel={soundToggleAria(audio.muted, t)}
    />
  );
}
