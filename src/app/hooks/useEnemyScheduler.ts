import { useEffect, useRef } from 'react';
import { activeUnit } from '@/game/engine';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';

export function useEnemyScheduler(): void {
  const snap = useGame();
  const { dispatch } = useGameRuntime();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battle = snap.game.battle;
  let enemyTurn = false;
  if (battle && !battle.result) {
    enemyTurn = activeUnit(snap.game)?.side === 'enemy';
  }

  useEffect(() => {
    if (!enemyTurn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current ??= setTimeout(() => {
      timerRef.current = null;
      void dispatch({ type: 'enemy' });
    }, 850);
  }, [enemyTurn, dispatch]);
}
