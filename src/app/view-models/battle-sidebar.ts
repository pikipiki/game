import type { BattleSidebarModel } from '@/app/types/battle-sidebar';
import type { BattleSelection } from '@/game/battle/controls';
import {
  LABEL_BATTLE_END_EYEBROW,
  LABEL_DEFEAT_SIDEBAR_COPY,
  LABEL_GARRISON_DEFEATED,
  LABEL_HERO_RETREATS,
  LABEL_VICTORY_HEADING,
  LABEL_VICTORY_SIDEBAR_COPY,
} from '@/game/battle/constants';
import { buildFighterPanelModel } from '@/game/battle/presentation';
import type { GameState } from '@/game/engine';

function resultTitle(state: GameState): string {
  const battle = state.battle!;
  if (battle.result === 'victory') return LABEL_VICTORY_HEADING;
  if (battle.opponent?.armyBackup) return LABEL_GARRISON_DEFEATED;
  return LABEL_HERO_RETREATS;
}

function resultBody(state: GameState): string {
  const battle = state.battle!;
  if (battle.result === 'victory') return LABEL_VICTORY_SIDEBAR_COPY;
  return LABEL_DEFEAT_SIDEBAR_COPY;
}

export function buildBattleSidebarViewModel(
  state: GameState,
  selection: BattleSelection,
): BattleSidebarModel {
  const battle = state.battle!;
  if (battle.result) {
    return {
      kind: 'result',
      eyebrow: LABEL_BATTLE_END_EYEBROW,
      title: resultTitle(state),
      body: resultBody(state),
    };
  }
  return {
    kind: 'fighter',
    panel: buildFighterPanelModel(state, selection),
  };
}
