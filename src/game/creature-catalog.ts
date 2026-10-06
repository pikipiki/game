import { CREATURES } from './constants';
import type { Creature } from './types';

export function getCreature(creatureId: string): Creature {
  const entry = CREATURES[creatureId];
  if (!entry) {
    throw new Error(`Créature inconnue : ${creatureId}`);
  }
  return entry;
}
