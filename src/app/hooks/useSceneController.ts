import { useEffect, useRef, type RefObject } from 'react';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';
import { AdventureScene } from '@/render/adventure';
import { GameScene } from '@/render/scene';

export interface SceneControllerOptions {
  readonly onWebglError?: () => void;
}

export function useSceneController(
  sceneHostRef: RefObject<HTMLElement | null>,
  options?: SceneControllerOptions,
) {
  const snap = useGame();
  const { sceneRef, onPick } = useGameRuntime();
  const battleModeRef = useRef<boolean>(false);
  const onWebglError = options?.onWebglError;

  useEffect(() => {
    const host = sceneHostRef.current;
    if (!host) return;
    try {
      sceneRef.current = new AdventureScene(host, onPick);
    } catch {
      onWebglError?.();
      sceneRef.current = null;
    }
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [sceneHostRef, sceneRef, onPick, onWebglError]);

  useEffect(() => {
    const host = sceneHostRef.current;
    if (!host || !sceneRef.current) return;
    const inBattle = Boolean(snap.game.battle);
    if (battleModeRef.current === inBattle) return;
    sceneRef.current.dispose();
    battleModeRef.current = inBattle;
    try {
      if (inBattle) {
        sceneRef.current = new GameScene(host, onPick);
      } else {
        sceneRef.current = new AdventureScene(host, onPick);
      }
    } catch {
      onWebglError?.();
      sceneRef.current = null;
    }
  }, [snap.game.battle, sceneHostRef, sceneRef, onPick, onWebglError]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || snap.resolving) return;
    const state = snap.game;
    const selectedUnit = state.battle?.units.find(
      (unit) => unit.id === snap.selectedFighter,
    );
    if (scene instanceof GameScene) {
      let highlight = snap.selected;
      if (state.battle) {
        highlight = snap.selectedBattleHex ?? selectedUnit ?? null;
      }
      scene.update(state, highlight, snap.selectedFighter);
    } else if (scene instanceof AdventureScene) {
      const followEnemyId =
        snap.opponentStrikePause && snap.opponentStrikeBubble
          ? snap.opponentStrikeBubble.enemyId
          : null;
      scene.update(state, snap.selected, followEnemyId);
    }
  }, [snap, sceneRef]);
}
