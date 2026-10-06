import type { RefObject } from 'react';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import MapIcon from '@mui/icons-material/Map';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import { CombatChromeView } from '@/app/components/battle/CombatChromeView';
import { MapCaptionView } from '@/app/components/layout/MapCaptionView';
import { MapHeadingView } from '@/app/components/layout/MapHeadingView';
import {
  GameActionButton,
  GameActionIconButton,
} from '@/app/components/ui/GameActionButton';
import { SceneWebglOverlay } from '@/app/components/feedback/SceneWebglOverlay';
import type {
  MapHeadingCopy,
  WebglErrorCopy,
  WorldShellLabels,
} from '@/app/lib/game-copy';
import type { CombatChromeModel } from '@/app/types/combat-presentation';

export interface WorldViewProps {
  readonly labels: WorldShellLabels;
  readonly mapHeading: MapHeadingCopy;
  readonly sceneHostRef: RefObject<HTMLDivElement | null>;
  readonly inBattle: boolean;
  readonly movementLabel: string;
  readonly retreatDisabled: boolean;
  readonly combatChrome: CombatChromeModel | null;
  readonly sceneWebglError: boolean;
  readonly webglError: WebglErrorCopy;
}

export function WorldView({
  labels,
  mapHeading,
  sceneHostRef,
  inBattle,
  movementLabel,
  retreatDisabled,
  combatChrome,
  sceneWebglError,
  webglError,
}: WorldViewProps) {
  return (
    <Box
      aria-label={labels.worldAria}
      className="world"
      component="section"
    >
      <MapHeadingView copy={mapHeading} />
      <div className="scene" id="scene" style={{ position: 'relative' }}>
        <div ref={sceneHostRef} style={{ position: 'absolute', inset: 0 }} />
        <SceneWebglOverlay copy={webglError} visible={sceneWebglError} />
      </div>
      <div className="map-tools">
        <GameActionIconButton
          gameAction="zoom-in"
          aria-label={labels.zoomIn}
        >
          <AddIcon fontSize="small" />
        </GameActionIconButton>
        <GameActionIconButton
          gameAction="zoom-out"
          aria-label={labels.zoomOut}
        >
          <RemoveIcon fontSize="small" />
        </GameActionIconButton>
        <GameActionIconButton
          gameAction="camera"
          aria-label={labels.recenter}
        >
          <GpsFixedIcon fontSize="small" />
        </GameActionIconButton>
        <GameActionIconButton
          gameAction="destinations"
          aria-label={labels.destinations}
        >
          <MapIcon fontSize="small" />
        </GameActionIconButton>
        <GameActionIconButton
          gameAction="tactical-moves"
          aria-label={labels.tacticalGrid}
          className="battle-only"
        >
          <MapIcon fontSize="small" />
        </GameActionIconButton>
      </div>
      <MapCaptionView
        allyLegend={labels.allyLegend}
        dragTip={labels.dragTip}
        enemyLegend={labels.enemyLegend}
        inBattle={inBattle}
        movementLabel={movementLabel}
      />
      <div className="map-compass" aria-hidden="true">
        <span>N</span>
        {' '}
        ✧
      </div>
      <GameActionButton
        gameAction="retreat"
        className="retreat"
        disabled={retreatDisabled}
        variant="subtle"
      >
        {labels.retreat}
      </GameActionButton>
      {combatChrome !== null && (
        <CombatChromeView
          initiativeBarAria={labels.initiativeBarAria}
          model={combatChrome}
        />
      )}
      <GameActionButton
        gameAction="training"
        className="training-entry"
        startIcon={<SportsMmaIcon />}
        variant="gold"
      >
        {labels.training}
      </GameActionButton>
    </Box>
  );
}
