import {
  AdventureSidebarView,
} from '@/app/components/sidebar/AdventureSidebarView';
import { BattleSidebarView } from '@/app/components/sidebar/BattleSidebarView';
import { selectBattleSelection } from '@/app/selectors/battle-selection';
import {
  buildAdventureSidebarViewModel,
} from '@/app/view-models/adventure-sidebar';
import { buildBattleSidebarViewModel } from '@/app/view-models/battle-sidebar';
import { useGame } from '@/app/providers/GameContext';

export function SidebarContainer() {
  const snap = useGame();
  const state = snap.game;

  let body;
  if (state.battle) {
    body = (
      <BattleSidebarView
        model={buildBattleSidebarViewModel(
          state,
          selectBattleSelection(snap),
        )}
      />
    );
  } else {
    body = (
      <AdventureSidebarView
        model={buildAdventureSidebarViewModel(
          state,
          snap.selected,
          snap.locale,
        )}
      />
    );
  }

  return (
    <aside className="sidebar" id="sidebar">
      {body}
    </aside>
  );
}
