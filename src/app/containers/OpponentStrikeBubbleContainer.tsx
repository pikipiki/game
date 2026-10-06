import { useEffect, useState, type RefObject } from 'react';
import { OpponentStrikeBubbleView } from '@/app/components/feedback/OpponentStrikeBubbleView';
import {
  useGame,
  useGameRuntime,
  type SceneInstance,
} from '@/app/providers/GameContext';
import { AdventureScene } from '@/render/adventure';

function anchorFromScene(
  sceneRef: RefObject<SceneInstance>,
  enemyId: string,
): { x: number; y: number } | null {
  const scene = sceneRef.current;
  if (!(scene instanceof AdventureScene)) return null;
  return scene.enemyBubbleAnchor(enemyId);
}

export function OpponentStrikeBubbleContainer() {
  const snap = useGame();
  const { sceneRef } = useGameRuntime();
  const bubble = snap.opponentStrikeBubble;
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!bubble) {
      setAnchor(null);
      return;
    }
    let frame = 0;
    const tick = () => {
      const next = anchorFromScene(sceneRef, bubble.enemyId);
      if (next) setAnchor(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [bubble, sceneRef]);

  if (!bubble || !anchor) return null;

  return (
    <OpponentStrikeBubbleView
      left={anchor.x}
      message={bubble.message}
      top={anchor.y}
    />
  );
}
