import { CombatToolbarView } from '@/app/components/battle/CombatToolbarView';
import { worldShellLabels } from '@/app/lib/game-copy';
import { useTranslation } from '@/app/hooks/useTranslation';
import { selectBattleSelection } from '@/app/selectors/battle-selection';
import { useGame } from '@/app/providers/GameContext';
import { buildCombatToolbarModel } from '@/game/battle/presentation';

export function CombatToolbarContainer() {
  const snap = useGame();
  const { t } = useTranslation();
  const shell = worldShellLabels(t);
  const state = snap.game;
  const selection = selectBattleSelection(snap);
  let model = null;
  if (state.battle) {
    model = buildCombatToolbarModel(
      state,
      selection,
      Boolean(snap.trainingBackup),
      t,
    );
  }

  return (
    <section
      className="combat-toolbar"
      id="combat-toolbar"
      aria-label={shell.combatToolbarAria}
    >
      {model !== null && (
        <CombatToolbarView model={model} />
      )}
    </section>
  );
}
