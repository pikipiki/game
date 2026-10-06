import type { SoundEffect } from '@/audio/types';
import type { Action } from '@/game/engine';

/** Effet sonore associé à une action (logique dérivée, hors composant). */
export function soundForGameAction(action: Action): SoundEffect {
  if (action.type === 'spell') return 'spell';
  if (action.type === 'catapult') return 'catapult';
  if (action.type === 'attack' || action.type === 'enemy') return 'attack';
  if (action.type === 'move' || action.type === 'battle-move') return 'move';
  return 'click';
}
