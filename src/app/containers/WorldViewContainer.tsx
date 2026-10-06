import { useCallback, useRef, useState } from 'react';
import { WorldView } from '@/app/components/world/WorldView';
import {
  adventureCaptionMovement,
  mapHeadingCopy,
  webglErrorCopy,
  worldShellLabels,
} from '@/app/lib/game-copy';
import { useTranslation } from '@/app/hooks/useTranslation';
import { useGame } from '@/app/providers/GameContext';
import { useSceneController } from '@/app/hooks/useSceneController';
import { buildCombatChromeModel } from '@/game/battle/presentation';
import { selectBattleSelection } from '@/app/selectors/battle-selection';

export function WorldViewContainer() {
  const snap = useGame();
  const { t } = useTranslation();
  const state = snap.game;
  const sceneHostRef = useRef<HTMLDivElement>(null);
  const [sceneWebglError, setSceneWebglError] = useState(false);
  const onWebglError = useCallback(() => {
    setSceneWebglError(true);
  }, []);
  useSceneController(sceneHostRef, { onWebglError });

  let combatChrome = null;
  if (state.battle) {
    combatChrome = buildCombatChromeModel(
      state,
      selectBattleSelection(snap),
      Boolean(snap.trainingBackup),
    );
  }

  let retreatDisabled = false;
  if (state.battle?.result) retreatDisabled = true;

  return (
    <WorldView
      combatChrome={combatChrome}
      inBattle={Boolean(state.battle)}
      labels={worldShellLabels(t)}
      mapHeading={mapHeadingCopy(state, t)}
      movementLabel={adventureCaptionMovement(state, t)}
      retreatDisabled={retreatDisabled}
      sceneHostRef={sceneHostRef}
      sceneWebglError={sceneWebglError}
      webglError={webglErrorCopy(t)}
    />
  );
}
