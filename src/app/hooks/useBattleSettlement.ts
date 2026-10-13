import { useEffect } from 'react';
import { useGame, useGameRuntime } from '@/app/providers/GameContext';

/** Quitte le combat dès que le résultat est connu (retour carte / campagne). */
export function useBattleSettlement(): void {
  const snap = useGame();
  const { dispatch, leaveTraining } = useGameRuntime();
  const battle = snap.game.battle;
  const result = battle?.result;

  useEffect(() => {
    if (!result || snap.resolving || snap.opponentStrikePause) return;
    if (snap.trainingBackup) {
      leaveTraining();
      return;
    }
    void dispatch({ type: 'finish-battle' });
  }, [
    result,
    snap.resolving,
    snap.opponentStrikePause,
    snap.trainingBackup,
    dispatch,
    leaveTraining,
  ]);
}
