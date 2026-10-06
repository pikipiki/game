import type { GameState } from '@/game/engine';
import type { TranslateFn } from '@/i18n/translate';

/** Message toast quand l’IA déclenche un combat sur la carte (fin de jour, etc.). */
export function opponentStrikeToast(
  before: GameState,
  after: GameState,
  t: TranslateFn,
): string | null {
  if (before.battle || !after.battle?.opponent) {
    return null;
  }
  if (after.battle.opponent.town) {
    return t('alerts.enemySiege');
  }
  return t('alerts.enemyAttack');
}
