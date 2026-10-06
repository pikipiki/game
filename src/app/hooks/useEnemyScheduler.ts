import { useEffect, useRef } from 'react';
import { activeUnit } from '@/game/engine';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';

export function useEnemyScheduler(): void {
  const snap = useGame();
  const { dispatch } = useGameRuntime();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battle = snap.game.battle;
  const activeId = battle?.active ?? null;
  let enemyTurn = false;
  if (battle && !battle.result) {
    enemyTurn = activeUnit(snap.game)?.side === 'enemy';
  }

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!enemyTurn || snap.resolving) return;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void dispatch({ type: 'enemy' });
    }, 850);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [enemyTurn, activeId, snap.resolving, dispatch]);
}
