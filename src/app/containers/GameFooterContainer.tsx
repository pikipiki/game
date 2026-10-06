import { GameFooterView } from '@/app/components/layout/GameFooterView';
import {
  footerShellLabels,
  saveIndicatorLabel,
} from '@/app/lib/game-copy';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGame } from '@/app/providers/GameContext';

export function GameFooterContainer() {
  const snap = useGame();
  const { t } = useTranslation();
  const state = snap.game;
  const save = saveIndicatorLabel(snap.storageWorks, snap.sandbox, t);

  if (state.battle) {
    return null;
  }

  return (
    <GameFooterView
      endDayDisabled={Boolean(state.battle) || state.won}
      labels={footerShellLabels(t, state.day)}
      saveStatus={save.status}
      saveUnsaved={save.unsaved}
    />
  );
}
